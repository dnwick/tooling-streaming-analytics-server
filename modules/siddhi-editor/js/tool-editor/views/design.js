/**
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
define(['require', 'log', 'jquery', 'jsplumb','backbone', 'lodash','jquery_ui'],

function (require, log, $, _jsPlumb ,Backbone, _

) {

    var DesignView = Backbone.View.extend(
        /** @lends DesignView.prototype */
        {
            /**
             * @augments Backbone.View
             * @constructs
             * @class DesignView Represents the view for the siddhi
             * @param {Object} options Rendering options for the view
             */
            initialize: function (opts) {
                var i =0;
                this.options = opts;

                console.log(this.options.container);
                $(this.options.container).append("<div class='innerContainer' id='container1'>");
                //alert(($(this.options.container)).attr('class'));
                _jsPlumb.ready(function() {

                    _jsPlumb.Defaults.PaintStyle = {
                        strokeStyle: "darkblue",
                        outlineColor: "transparent",
                        outlineWidth: "25",
                        lineWidth: 2
                    };
                    _jsPlumb.Defaults.HoverPaintStyle = {strokeStyle: 'darkblue', lineWidth: 3};
                    _jsPlumb.Defaults.EndpointStyle = {radius: 3};
                    _jsPlumb.Defaults.Overlays = [["Arrow", {location: 1.0, id: "arrow"}]];
                    _jsPlumb.importDefaults({
                        ConnectionsDetachable: false,
                        Connector: ["Bezier", {curviness: 50}]
                    });
                    _jsPlumb.setContainer($(opts.container));

                    $(opts.container).droppable
                    ({
                        accept: '#stream, #window-stream, #pass-through, #filter-query,  #join-query, #window-query, #pattern ',
                        drop: function (e, ui) {
                            console.log(i);
                            i++;
                        }
                    });
                });
            }

        });

    return DesignView;
});

