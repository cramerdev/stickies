/*global window, dojo, dojox */

dojo.require("dojox.data.PersevereStore");
dojo.require("dojo.dnd.move");
dojo.require("dijit._base.place"); // for positioning

dojo.addOnLoad(function () {
    var url = "http://websticki.es",
        css = url + "/css/stickies.css",
        loc = { // page and domain for query
            domain : window.location.host.replace(/^(www\.)?/, ""), // no www!
            path : window.location.pathname
        },
        body = dojo.body(),
        center = (function () { // center of the screen
            var vp = dijit.getViewport();
            return {
                x : vp.w / 2,
                y : vp.h / 2
            };
        })(),
        s; // The sticky store

    /** Insert stickies CSS */
    function insertCSS() {
        dojo.place(dojo.create("link", {
            href : css,
            rel : "stylesheet",
            type : "text/css",
            media : "screen"
        }), dojo.query("head")[0]);
    }

    /** Fetch Stickies! from store and open them */
    function fetch(store) {
        store.fetch({
            query : loc,
            onComplete : function (results) {
                if (typeof results === "object") {
                    for (var r in results) { 
                        if (results.hasOwnProperty(r) && Number(r) >= 0) {
                            open(results[r]);
                        }
                    }
                }
            }
        });
    }

    /** Create a new sticky */
    function open(item) {
        var isNew = typeof item !== "object", 
            a, d, x, dm; // elements and mover

        function insert() {
            dojo.place(a, d);
            dojo.place(x, d);

            // Fade in new notes
            if (isNew) { dojo.attr(d, { opacity : 0 }); }

            dojo.place(d, body);
            if (isNew) { dojo.anim(d, { opacity : 1 }); }
        }

        function handleEvents() {
            dm = new dojo.dnd.Moveable(d, { skip : true });
            dojo.connect(a, "onblur", function (evt) {
                if (!item.readOnly) { 
                    s.setValue(item, "text", a.value);
                    s.save(); 
                }
            });
            dojo.connect(dm, "onMoveStop", function (mover) {
                var c = dojo.coords(mover.node);
                if (!item.readOnly) { 
                    s.setValue(item, "x", c.x - center.x);
                    s.setValue(item, "y", c.y);
                    s.save(); 
                }
            });
            dojo.connect(x, "onclick", function (evt) {
                dojo.stopEvent(evt);
                dojo.anim(d, { // fade note out
                    opacity : 0,
                    onEnd : function () { dojo.destroy(d); }
                });
                if (!item.readOnly) { 
                    s.deleteItem(item);
                    s.save(); 
                }
             });
        }

        // When no object gets passed in to open, create a new one
        if (isNew) {
            item = s.newItem(dojo.mixin({ x : 0, y : center.y }, loc));
            // Make items on the stickies home page read only
            s.setValue(item, "readOnly", loc.domain === "websticki.es");
            s.setValue(item, "text", "");
        }

        // Text area
        a = dojo.create("textarea", { innerHTML : item.text });
        // Close button
        x = dojo.create("a", { innerHTML : "&times;", href : "#" });
        // Enclosing div
        d = dojo.create("div", {
            className : "stickiesSticky",
            style : {
                left: (item.x + center.x) + "px",
                top: item.y + "px"
            }
        });

        insert();
        handleEvents();
    }

    /** Insert link to make a new sticky! */
    function insertLink() {
        var link = dojo.create("a", {
            innerHTML : "new Sticky!",
            className : "stickiesNew",
            href : "#"
        });
        dojo.connect(link, "onclick", function (evt) {
            dojo.stopEvent(evt);
            open();
        });
        dojo.place(link, body);
    }

    insertCSS();
    insertLink();

    // Set up notes
    dojox.data.PersevereStore.getStores(url).addCallback(function (stores) {
        s = stores.Sticky;
        fetch(s);
    });
});  
