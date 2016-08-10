#This module is inspired by the node-red-node-mongodb package available <a href="https://github.com/node-red/node-red-nodes/blob/master/storage/mongodb/">here</a>.

node-red-contrib-linvodb3
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to save data in a LinvoDb3 database with a medea store.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

        npm install https://github.com/BenjaminVadant/node-red-contrib-linvodb3

Usage
-----

Nodes to save and retrieve data in a LinvoDb3 instance.

### Input

Calls a LinvoDb3 collection method based on the selected operator.

*Find* queries a collection using the `msg.payload` as the query statement as
per the *.find()* function.

Optionally, you may also (via a function) set

- a `msg.projection` object to constrain the returned fields,
- a `msg.sort` object,
- a `msg.limit` number,
- a `msg.skip` number.

*Count* returns a count of the number of documents in a collection or matching a
query using the `msg.payload` as the query statement.

*Aggregate* provides access to the aggregation pipeline using the `msg.payload` as the pipeline array.

You can either set the collection method in the node config or on `msg.server` AND `msg.collection`.
Attention, corresponding linvodb3 and linvodb3-collection have to be set before use.
Setting it in the node will override `msg.collection`.

See the <a href="https://github.com/Ivshti/linvodb3" target="new">*LinvoDb3 collection methods docs*</a> for examples.

The result is returned in `msg.payload`.

### Output

A simple LinvoDb3 output node. Can save, insert, update and remove objects from a chosen collection.

LinvoDb3 only accepts objects.

Save and insert can either store `msg` or `msg.payload`. If msg.payload is
selected it should contain an object. If not it will be wrapped in an object with a name of payload.

*Save* will update an existing object or insert a new object if one does not already exist.

*Insert* will insert a new object.

*Update* will modify an existing object or objects. The query to select objects
to update uses `msg.query` and the update to the element uses `msg.payload`.
Update can add an object if it does not exist or update multiple objects.

*Remove* will remove objects that match the query passed in on `msg.payload`.
A blank query will delete *all of the objects* in the collection.

You can either set the collection method in the node config or on `msg.collection`.
Setting it in the node will override `msg.collection`.

By default LinvoDb3 creates an `msg._id` property as the primary key - so
repeated injections of the same `msg` will result in many database entries.
If this is NOT the desired behaviour - ie. you want repeated entries to overwrite,
then you must set the `msg._id` property to be a constant by the use of a previous function node.
This must be done at the correct level. If only writing msg.payload then payload must contain the \_id property.
If writing the whole msg object then it must contain an \_id property.

This could be a unique constant or you could create one based on some other msg property.

Currently we do not limit or cap the collection size at all...
