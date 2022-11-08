//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-suhas:Test123@cluster0.warzwmd.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = new mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = new mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find(function(err, result) {
    if (result.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB");
        }
      });
    }
    res.render("list", {listTitle: "Today",newListItems: result});
  });
});


app.get("/:listName", function(req, res) {
  const listName = _.capitalize(req.params.listName);
  List.findOne({name: listName}, function(err, foundList) {
    if(!err) {
      if (!foundList) {
        const newList = new List({
          name: listName,
          items: defaultItems
        });
        newList.save();
        res.redirect("/" + listName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});




app.post("/", function(req, res) {
  const item = new Item({
    name: req.body.newItem
  });
  if (req.body.list === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: req.body.list}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + req.body.list);
    });
  }

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }


});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully!");
});
