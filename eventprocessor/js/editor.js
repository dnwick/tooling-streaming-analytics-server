/*
 * Copyright (c) 2014, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 *  This Script contains the integration code segment of Siddhi editor.
 *  This will set the options of ACE editor, attach client side parser and attach SiddhiCompletion Engine with the editor
 **/
(function () {
    // Adding SiddhiEditor namespace
    var SiddhiEditor = window.SiddhiEditor || {};
    window.SiddhiEditor = SiddhiEditor;

    // ANTLE4 JS runtime integration code segment goes here..
    var antlr4 = require(ANTLR_CONSTANT.ROOT + ANTLR_CONSTANT.INDEX);                                                   // ANTLR4 JS runtime
    var SiddhiQLLexer = require(ANTLR_CONSTANT.ROOT + ANTLR_CONSTANT.SIDDHI_LEXER).SiddhiQLLexer;
    var SiddhiQLParser = require(ANTLR_CONSTANT.ROOT + ANTLR_CONSTANT.SIDDHI_PARSER).SiddhiQLParser;
    var CustomSiddhiListener = require(ANTLR_CONSTANT.ROOT + ANTLR_CONSTANT.SIDDHI_LISTENER).CustomSiddhiListener;      // Custom listener for Siddhi
    var AceErrorListener = require(ANTLR_CONSTANT.ROOT + ANTLR_CONSTANT.ERROR_LISTENER).AceErrorListener;
    var TokenTooltip = require(ACE_CONSTANT.TOKEN_TOOLTIP).TokenTooltip;                                                // Required for token tooltips

    SiddhiEditor.langTools = ace.require(ACE_CONSTANT.LANG_TOOL);                    // Required for auto completion
    SiddhiEditor.Range = ace.require(ACE_CONSTANT.ACE_RANGE).Range;                  // Required for extracting part of the query
    SiddhiEditor.debug = false;

    /**
     * Initialize the editor
     *
     * @param {Object} config The configuration object to be used in the initialization
     */
    SiddhiEditor.init = function (config) {
        var foundSemanticErrors = false;
        var editor = ace.edit(config.divID);                // Setting the DivID of the Editor .. Could be <pre> or <div> tags
        SiddhiEditor.editor = editor;                       // Saving editor instance in SiddhiEditor namespace for later use

        editor.realTimeValidation = config.realTimeValidation;
        editor.tokenTooltip = new TokenTooltip(editor);
        editor.setReadOnly(config.readOnly);
        // Setting the editor options ...
        editor.session.setMode(ACE_CONSTANT.SIDDHI_MODE);   // Language mode located at ace_editor/mode-siddhi.js
        editor.setTheme(ACE_CONSTANT.THEME);                // Theme located at ace_editor/theme/crimson_editor.js
        editor.getSession().setUseWrapMode(true);
        editor.getSession().setTabSize(4);
        editor.getSession().setUseSoftTabs(true);
        editor.setShowFoldWidgets(true);
        editor.setBehavioursEnabled(true);
        editor.setHighlightSelectedWord(true);
        editor.setHighlightActiveLine(true);
        editor.setDisplayIndentGuides(true);
        editor.setShowPrintMargin(false);
        editor.setOptions({
            enableBasicAutocompletion: !config.readOnly && config.autoCompletion,
            enableSnippets: !config.readOnly && config.autoCompletion,
            enableLiveAutocompletion: false,
            autoScrollEditorIntoView: true,
            enableMultiselect: true
        });

        // State variables for error checking and highlighting
        editor.state = {};
        editor.state.previousParserTree = "";
        editor.state.syntaxErrorList = [];      // To save the syntax Errors with line numbers
        editor.state.semanticErrorList = [];    // To save semanticErrors with line numbers
        editor.state.lastEdit = 0;              // Last edit time

        editor.completionEngine = new CompletionEngine();

        // Adding Siddhi specific autocompleter
        if (!config.readOnly && config.autoCompletion) {
            SiddhiEditor.langTools.addCompleter(editor.completionEngine.SiddhiCompleter);
            loadMetaData(ACE_CONSTANT.EXTENSION, "extensions");
            loadMetaData(ACE_CONSTANT.INBUILT, "system");
        }

        // Attaching editor's onChange event handler
        editor.getSession().on('change', editorChangeHandler);

        /**
         * Editor change handler
         *
         * @param event Event object
         */
        function editorChangeHandler(event) {
            editor.completionEngine.streamList.clear();        // Clear the exiting streams
            var position = editor.getCursorPosition();
            if (event.data.text == "\n") {
                // If the current input is new line , update the line numbers of semantic error
                for (var index = 0; index < editor.state.semanticErrorList.length; index++) {
                    if (editor.state.semanticErrorList[index].row > position.row ||
                            (editor.state.semanticErrorList[index].row == position.row && position.column == 0)) {
                        editor.state.semanticErrorList[index].row++;
                    }
                }
            }

            if (event.data.action == "removeLines") {
                // If current line is deleted , update the line numbers of errors
                for (index = 0; index < editor.state.semanticErrorList.length; index++) {
                    if (editor.state.semanticErrorList[index].row > position.row ||
                            (editor.state.semanticErrorList[index].row == position.row && position.column == 0)) {
                        editor.state.semanticErrorList[index].row--;
                    }
                }
            }

            // setAnnotation() will display the error markers with messages
            // syntaxErrors are recalculated again later using custom antlr4 listener -> Keyprinter
            editor.session.setAnnotations(combine(editor.state.syntaxErrorList, editor.state.semanticErrorList));

            if (editor.state.syntaxErrorList.length > 0) {
                // Remove the existing syntax errors
                editor.state.syntaxErrorList.splice(0, editor.state.syntaxErrorList.length);
            }

            // Following code segment parse the input query using antlr4's parser and lexer
            var errorListener = new AceErrorListener(editor);
            var expression = editor.getValue().trim();          // Input text
            var txt = new antlr4.InputStream(expression);       // Input stream
            var lexer = new SiddhiQLLexer(txt);                 // Generating lexer
            lexer._listeners = [];
            lexer._listeners.push(errorListener);
            var tokens = new antlr4.CommonTokenStream(lexer);   // Generated a token stream
            var parser = new SiddhiQLParser(tokens);            // Using the token stream , generate the parser
            parser._listeners = [];
            parser._listeners.push(errorListener);
            parser.buildParseTrees = true;

            // parser() is the root level grammar rule. This line generates a parser tree.
            // when generating the new parserTree, the ErrorListener
            // (client_side_Siddhi_parser/antlr4/error/ErrorListener.js -> ConsoleErrorListener.syntaxError()) will be invoked automatically.
            // within that method , the syntax errors are stored in  editor.state.syntaxErrorList
            var tree = parser.parse();

            // By now the current syntax errors are identified . following line shows the all the errors again.
            editor.session.setAnnotations(combine(editor.state.syntaxErrorList, editor.state.semanticErrorList));

            // To maintains the line numbers against the distinct query statements(streamDefinitions,query,functionDefinitions..).
            // statementList is important when checking semantic errors.
            // The input execution plan is submitted to the server statement by statement for semantic error checking
            editor.statementsList = [];

            var parserListener = new CustomSiddhiListener(editor);

            // Default walker will traverse through the parserTree and generate events . Those events are listen by the parserListener and update the statementsList with line numbers.
            antlr4.tree.ParseTreeWalker.DEFAULT.walk(parserListener, tree);

            if (parser._syntaxErrors == 0 &&
                config.realTimeValidation && (editor.state.previousParserTree != tree.toStringTree(tree, parser))) {
                // If there are no syntax errors and there is a change in parserTree => check for semantic errors if there is no change in the query within 3sec period
                // 3 seconds delay is added to avoid repeated server calls while user is typing the query.

                setTimeout(checkForSemanticErrors, 3000);
            }
            editor.state.previousParserTree = tree.toStringTree(tree, parser);  // Save the current parser tree
            editor.state.lastEdit = Date.now();                                 // Keep user's last edit time
        }

        /**
         * This method send server calls to check the semantic errors
         */
        function checkForSemanticErrors() {
            foundSemanticErrors = false;

            if (Date.now() - editor.state.lastEdit >= 3000) {
                // If the user has not typed anything after 3 seconds from his last change, then send the query for semantic check
                // check whether the query contains errors or not
                var isValid = submitToServerForSemanticErrorCheck(editor.getValue(), true);

                if (!isValid) {
                    // If the query contains semantic  errors. send the query in a constructive manner to sever to get the line number with error
                    // This check is needed because the ServerSide compiler doesn't return line numbers of the semantic errors.
                    var query = "";
                    for (var i = 0; i < editor.statementsList.length; i++) {
                        query += editor.statementsList[i].state + "  \n";
                        submitToServerForSemanticErrorCheck(query, false, editor.statementsList[i].line, editor.statementsList[i].state);
                        if (foundSemanticErrors)
                            break;
                    }
                }

            }
        }

        /**
         * This Method submit the query to server for semantic error checking
         * if(errorCheck)
         *      => This method is called to check the validity of the complete query
         * else
         *      => This method is called to check the validity of the sub statements.
         *
         * Ex: suppose the query is like below
         *     1. define stream Abc( def int) -> A
         *     2. from Abc      -> B
         *     3. select def
         *     4. insert into Ghi
         *
         *     ***To check complete query -> submitToServerForSemanticErrorCheck(executionPlan,true)
         *     ***To find the line number with the error->
         *                  submitToServerForSemanticErrorCheck(A , false , 1 , "define ...")
         *                  submitToServerForSemanticErrorCheck(A+B,false , 3 , "from abc ..")
         *
         * @param {string} executionPlan The input query
         * @param {boolean} errorCheck isValid check or not.
         * @param {int} [line] line number related to the current statement
         * @param {string} [checkingQuery] currently checking query statement
         * @returns {boolean} query is valid or not
         */
        function submitToServerForSemanticErrorCheck(executionPlan, errorCheck, line, checkingQuery) {
            // if (executionPlan == "") {
            //     console.log("Query expressions cannot be empty.");
            //     return;
            // }
            //
            // var path = "../eventprocessor/validate_siddhi_queries_ajaxprocessor.jsp";
            // if (errorCheck) {
            //     var responseText = jQuery.ajax({
            //             type: "POST",
            //             url: path,
            //             async: false,
            //             data: {executionPlan: executionPlan}
            //
            //         }
            //     ).responseText;
            //
            //     editor.state.semanticErrorList.splice(0, editor.state.semanticErrorList.length);
            //     responseText = responseText.trim();
            //     if (responseText === "success") {
            //         //if no semantic errors => show again the errors . But this time the semantic errors will not be listed
            //
            //         SiddhiEditor.editor.session.setAnnotations(combine(editor.state.semanticErrorList, editor.state.syntaxErrorList));
            //         return true;
            //     } else
            //         return false;
            //
            // } else {
            //     jQuery.ajax({
            //             type: "POST",
            //             url: path,
            //             async: true,
            //             data: {executionPlan: executionPlan},
            //             success: function (resultText) {
            //                 resultText = resultText.trim();
            //                 //Clear the existing semantic errors
            //                 editor.state.semanticErrorList.splice(0, editor.state.semanticErrorList.length);
            //
            //                 if (resultText == "success") {
            //                     //show the errors . Since the semantic error list is cleared by now=> No semantic errors will be shown here.
            //                     SiddhiEditor.editor.session.setAnnotations(combine(editor.state.semanticErrorList, editor.state.syntaxErrorList));
            //                     return;
            //                 } else {
            //                     //update the semanticErrorList
            //                     editor.state.semanticErrorList.push({
            //                         row: line - 1,
            //                         text: resultText,
            //                         type: "error",
            //                         inputText: checkingQuery
            //                     });
            //
            //                     //update the state of the foundError.=> stop sending another server call
            //                     foundErrors = true;
            //
            //                     //show the errors
            //                     SiddhiEditor.editor.session.setAnnotations(combine(editor.state.semanticErrorList, editor.state.syntaxErrorList));
            //                     return;
            //                 }
            //             }
            //         }
            //     );
            // }

            // TODO : Remove the code below and implement server side validation
            editor.state.semanticErrorList.push({
                row: line - 1,
                text: 'Server side not yet implemented',
                type: "error",
                inputText: checkingQuery
            });

            //update the state of the foundError.=> stop sending another server call
            foundSemanticErrors = true;

            //show the errors
            editor.session.setAnnotations(combine(editor.state.semanticErrorList, editor.state.syntaxErrorList));
            // TODO : Remove the code above
        }

        return editor;

        /**
         * Load meta data from a json file
         *
         * @param jsonFile JSON file from which the meta data should be loaded
         * @param type The type of meta data to be loaded
         */
        function loadMetaData(jsonFile, type) {
            jQuery.getJSON("js/" + jsonFile, function (data) {
                editor.completionEngine[type] = data;
            });
        }
    };

    /**
     * This is a utility function that will concatenate 2 arrays
     *
     * @param {Array} array1 Array to be added at the first part of the returned array
     * @param {Array} array2 Array to be added at the last part of the returned array
     * @returns {Array}
     */
    function combine(array1, array2) {
        return array1.concat(array2);
    }
}());


