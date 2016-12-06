/*
 * Taken from ace editor demos and updated to suit the siddhi editor
 * Generates the token tool tips on mouse over
 */

/*
 * Generating tooltips when user hovers over a token
  * The tooltip content is set in siddhi-editor.js
 */
define(["ace/lib/dom", "ace/lib/oop", "ace/lib/event", "ace/range", "ace/tooltip", "exports"],
    function (dom, oop, event, range, tooltip, exports) {

    "use strict";   // JS strict mode

    function TokenTooltip(editor) {
        if (editor.tokenTooltip)
            return;
        tooltip.Tooltip.call(this, editor.container);
        editor.tokenTooltip = this;
        this.editor = editor;

        this.update = this.update.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseOut = this.onMouseOut.bind(this);
        event.addListener(editor.renderer.scroller, "mousemove", this.onMouseMove);
        event.addListener(editor.renderer.content, "mouseout", this.onMouseOut);
    }

    oop.inherits(TokenTooltip, tooltip.Tooltip);

    (function () {
        this.token = {};
        this.range = new range.Range();

        this.update = function () {
            this.$timer = null;

            var r = this.editor.renderer;
            if (this.lastT - (r.timeStamp || 0) > 1000) {
                r.rect = null;
                r.timeStamp = this.lastT;
                this.maxHeight = window.innerHeight;
                this.maxWidth = window.innerWidth;
            }

            var canvasPos = r.rect || (r.rect = r.scroller.getBoundingClientRect());
            var offset = (this.x + r.scrollLeft - canvasPos.left - r.$padding) / r.characterWidth;
            var row = Math.floor((this.y + r.scrollTop - canvasPos.top) / r.lineHeight);
            var col = Math.round(offset);

            var screenPos = {row: row, column: col, side: offset - col > 0 ? 1 : -1};
            var session = this.editor.session;
            var docPos = session.screenToDocumentPosition(screenPos.row, screenPos.column);
            var token = session.getTokenAt(docPos.row, docPos.column);

            if (!token && !session.getLine(docPos.row)) {
                token = {
                    type: "",
                    value: "",
                    state: session.bgTokenizer.getState(0)
                };
            }
            if (!token) {
                session.removeMarker(this.marker);
                this.hide();
                return;
            }

            // This had been changed to suit the siddhi editor implementation of token tool tips
            var tokenText = token.tooltip;
            if (!tokenText) {
                tokenText = token.type;
            }
            if (!tokenText) {
                return;
            }

            if (this.tokenText != tokenText) {
                this.setHtml(tokenText);
                this.width = this.getWidth();
                this.height = this.getHeight();
                this.tokenText = tokenText;
            }

            this.show(null, this.x, this.y);

            this.token = token;
            session.removeMarker(this.marker);
            this.range = new range.Range(docPos.row, token.start, docPos.row, token.start + token.value.length);
            this.marker = session.addMarker(this.range, "ace_bracket", "text");
        };

        this.onMouseMove = function (e) {
            this.x = e.clientX;
            this.y = e.clientY;
            if (this.isOpen) {
                this.lastT = e.timeStamp;
                this.setPosition(this.x, this.y);
            }
            if (!this.$timer)
                this.$timer = setTimeout(this.update, 100);
        };

        this.onMouseOut = function (e) {
            if (e && e.currentTarget.contains(e.relatedTarget))
                return;
            this.hide();
            this.editor.session.removeMarker(this.marker);
            this.$timer = clearTimeout(this.$timer);
        };

        this.setPosition = function (x, y) {
            if (x + 10 + this.width > this.maxWidth)
                x = window.innerWidth - this.width - 10;
            if (y > window.innerHeight * 0.75 || y + 20 + this.height > this.maxHeight)
                y = y - this.height - 30;

            tooltip.Tooltip.prototype.setPosition.call(this, x + 10, y + 20);
        };

        this.destroy = function () {
            this.onMouseOut();
            event.removeListener(this.editor.renderer.scroller, "mousemove", this.onMouseMove);
            event.removeListener(this.editor.renderer.content, "mouseout", this.onMouseOut);
            delete this.editor.tokenTooltip;
        };

    }).call(TokenTooltip.prototype);

    exports.TokenTooltip = TokenTooltip;
});