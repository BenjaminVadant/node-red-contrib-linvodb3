module.exports = function(RED) {
    "use strict";
    var LinvoDB = require('linvodb3');

    function LinvoNode(n) {
        RED.nodes.createNode(this,n);
        this.path = n.path;
        this.name = n.name;

        LinvoDB.dbPath = this.path;

        this.LinvoDB = LinvoDB;
    }

    RED.nodes.registerType("linvodb3",LinvoNode);

    function LinvoCollectionNode(n) {
        RED.nodes.createNode(this,n);
        this.name = n.name;
        this.server = n.server;
        this.serverConf = RED.nodes.getNode(this.server);

        if(this.serverConf) {
            this.client = new this.serverConf.LinvoDB(this.name,{},{store : { db: require("medeadown") }});
        } else {
            this.error(RED._("linvodb3.errors.missingconfig"));
        }
    }

    RED.nodes.registerType("linvodb3-collection",LinvoCollectionNode);

    function ensureValidSelectorObject(selector) {
        if (selector != null && (typeof selector != 'object' || Buffer.isBuffer(selector))) {
            return {};
        }
        return selector;
    }


    function LinvoOutNode(n) {
        RED.nodes.createNode(this,n);
        this.collection = n.collection;
        this.payonly = n.payonly || false;
        this.upsert = n.upsert || false;
        this.multi = n.multi || false;
        this.operation = n.operation;


            var node = this;

            node.on("input",function(msg) {
                var coll;
                if (!node.collection) {
                    if (msg.collection) {
                        coll = RED.nodes.getNode(msg.collection).client;
                    } else {
                        node.error(RED._("linvodb3.errors.nocollection"),msg);
                        return;
                    }
                }
                else {
                    coll = RED.nodes.getNode(node.collection).client;
                }

                delete msg._topic;
                delete msg.collection;

                if (node.operation === "store") {
                    if (node.payonly) {
                        if (typeof msg.payload !== "object") {
                            msg.payload = {"payload": msg.payload};
                        }
                        if (msg.hasOwnProperty("_id") && !msg.payload.hasOwnProperty("_id")) {
                            msg.payload._id = msg._id;
                        }
                        coll.save(msg.payload,function(err, item) {
                            if (err) {
                                node.error(err,msg);
                            }
                        });
                    } else {
                        coll.save(msg,function(err, item) {
                            if (err) {
                                node.error(err,msg);
                            }
                        });
                    }
                } else if (node.operation === "insert") {
                    if (node.payonly) {
                        if (typeof msg.payload !== "object") {
                            msg.payload = {"payload": msg.payload};
                        }
                        if (msg.hasOwnProperty("_id") && !msg.payload.hasOwnProperty("_id")) {
                            msg.payload._id = msg._id;
                        }
                        coll.insert(msg.payload, function(err, item) {
                            if (err) {
                                node.error(err,msg);
                            }
                        });
                    } else {
                        coll.insert(msg, function(err,item) {
                            if (err) {
                                node.error(err,msg);
                            }
                        });
                    }
                } else if (node.operation === "update") {
                    if (typeof msg.payload !== "object") {
                        msg.payload = {"payload": msg.payload};
                    }
                    var query = msg.query || {};
                    var payload = msg.payload || {};
                    var options = {
                        upsert: node.upsert,
                        multi: node.multi
                    };

                    coll.update(query, payload, options, function(err, item) {
                        if (err) {
                            node.error(err,msg);
                        }
                    });
                } else if (node.operation === "delete") {
                    coll.remove(msg.payload, function(err, items) {
                        if (err) {
                            node.error(err,msg);
                        }
                    });
                }
            });

    }
    RED.nodes.registerType("linvodb3 out",LinvoOutNode);

    function LinvoInNode(n) {
        RED.nodes.createNode(this,n);
        this.collection = n.collection;
        this.operation = n.operation || "find";

            var node = this;

            node.on("input", function(msg) {
                var coll;
                if (!node.collection) {
                    if (msg.collection) {
                        coll = RED.nodes.getNode(msg.collection).client;
                    } else {
                        node.error(RED._("linvodb3.errors.nocollection"),msg);
                        return;
                    }
                }
                else {
                    coll = RED.nodes.getNode(node.collection).client;
                }
                var selector;
                if (node.operation === "find") {
                    msg.projection = msg.projection || {};
                    selector = ensureValidSelectorObject(msg.payload);
                    var limit = msg.limit;
                    if (typeof limit === "string" && !isNaN(limit)) {
                        limit = Number(limit);
                    }
                    var skip = msg.skip;
                    if (typeof skip === "string" && !isNaN(skip)) {
                        skip = Number(skip);
                    }

                    coll.find(selector,msg.projection).sort(msg.sort).limit(limit).skip(skip).exec(function(err, items) {
                        if (err) {
                            node.error(err);
                        } else {
                            msg.payload = items;
                            delete msg.projection;
                            delete msg.sort;
                            delete msg.limit;
                            delete msg.skip;
                            node.send(msg);
                        }
                    });
                } else if (node.operation === "count") {
                    selector = ensureValidSelectorObject(msg.payload);
                    coll.count(selector, function(err, count) {
                        if (err) {
                            node.error(err);
                        } else {
                            msg.payload = count;
                            node.send(msg);
                        }
                    });
                } else if (node.operation === "aggregate") {
                    msg.payload = (Array.isArray(msg.payload)) ? msg.payload : [];
                    coll.aggregate(msg.payload, function(err, result) {
                        if (err) {
                            node.error(err);
                        } else {
                            msg.payload = result;
                            node.send(msg);
                        }
                    });
                }
            });

    }
    RED.nodes.registerType("linvodb3 in",LinvoInNode);
}
