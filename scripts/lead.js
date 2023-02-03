const APIKEY = "63da313e3bc6b255ed0c4536";
function getContacts(limit = 20, all = true) {

    //[STEP 7]: Create our AJAX settings
    let settings = {
      "async": true,
      "crossDomain": true,
      "url": "https://idfinalassignment-8af7.restdb.io/rest/_swagger.json",
      "method": "GET", //[cher] we will use GET to retrieve info
      "headers": {
        "content-type": "application/json",
        "x-apikey": APIKEY,
        "cache-control": "no-cache"
      },
    }

    //[STEP 8]: Make our AJAX calls
    //Once we get the response, we modify our table content by creating the content internally. We run a loop to continously add on data
    //RESTDb/NoSql always adds in a unique id for each data, we tap on it to have our data and place it into our links 
    $.ajax(settings).done(function(response) {

      let content = "";

      for (var i = 0; i < response.length && i < limit; i++) {
        //console.log(response[i]);
        //[METHOD 1]
        //let's run our loop and slowly append content
        //we can use the normal string append += method
        /*
        content += "<tr><td>" + response[i].name + "</td>" +
          "<td>" + response[i].email + "</td>" +
          "<td>" + response[i].message + "</td>
          "<td>Del</td><td>Update</td</tr>";
        */

        //[METHOD 2]
        //using our template literal method using backticks
        //take note that we can't use += for template literal strings
        //we use ${content} because -> content += content 
        //we want to add on previous content at the same time
        content = `${content}<tr id='${response[i]._id}'><td>${response[i].username}</td>
        <td>${response[i].points}</td>

      }

      //[STEP 9]: Update our HTML content
      //let's dump the content into our table body
      $("#contact-list tbody").html(content);

      $("#total-contacts").html(response.length);
    });


  }

  //[STEP 10]: Create our update listener
  //here we tap onto our previous table when we click on update
  //this is a delegation feature of jquery
  //because our content is dynamic in nature, we listen in on the main container which is "#contact-list". For each row we have a class .update to help us
  $("#contact-list").on("click", ".update", function(e) {
    e.preventDefault();
    //update our update form values
    let contactName = $(this).data("name");
    let contactEmail = $(this).data("email");
    let contactMsg = $(this).data("msg");
    let contactMentor = $(this).data("mentor");
    let contactId = $(this).data("id");
    console.log($(this).data("msg"));

    //[STEP 11]: Load in our data from the selected row and add it to our update contact form 
    $("#update-contact-name").val(contactName);
    $("#update-contact-email").val(contactEmail);
    $("#update-contact-msg").val(contactMsg);
    $("#update-contact-mentor").val(contactMentor);
    $("#update-contact-id").val(contactId);
    $("#update-contact-container").show();

  });//end contact-list listener for update function

  //[STEP 12]: Here we load in our contact form data
  //Update form listener
  $("#update-contact-submit").on("click", function(e) {
    e.preventDefault();
    //retrieve all my update form values
    let contactName = $("#update-contact-name").val();
    let contactEmail = $("#update-contact-email").val();
    let contactMsg = $("#update-contact-msg").val();
    let contactMentor = $("#update-contact-mentor").val();
    let contactId = $("#update-contact-id").val();

    console.log($("#update-contact-msg").val());
    console.log(contactMsg);

    //[STEP 12a]: We call our update form function which makes an AJAX call to our RESTDB to update the selected information
    updateForm(contactId, contactName, contactEmail, contactMsg, contactMentor);
  });//end updatecontactform listener

  //[STEP 13]: function that makes an AJAX call and process it 
  //UPDATE Based on the ID chosen
  function updateForm(id, contactName, contactEmail, contactMsg, contactMentor) {
    //@TODO create validation methods for id etc. 

    var jsondata = {
      "name": contactName,
      "email": contactEmail,
      "message": contactMsg,
      "mentor": contactMentor
    };
    var settings = {
      "async": true,
      "crossDomain": true,
      "url": `https://idp06-baad.restdb.io/rest/contact/${id}`,//update based on the ID
      "method": "PUT",
      "headers": {
        "content-type": "application/json",
        "x-apikey": APIKEY,
        "cache-control": "no-cache"
      },
      "processData": false,
      "data": JSON.stringify(jsondata)
    }

    //[STEP 13a]: send our AJAX request and hide the update contact form
    $.ajax(settings).done(function(response) {
      console.log(response);

      $("#update-contact-container").fadeOut(5000);
      //update our contacts table
      getContacts();
    });
  }//end updateform function
  $("#contact-list").on("click", ".delete", function(e) {
    e.preventDefault();
    let id = $(this).data("id");

    var settings = {
      "async": true,
      "crossDomain": true,
      "url": `https://idp06-baad.restdb.io/rest/contact/${id}`,
      "method": "DELETE",
      "headers": {
        "content-type": "application/json",
        "x-apikey": APIKEY,
        "cache-control": "no-cache"
      }
    }

    $.ajax(settings).done(function(response) {
      console.log(response);
      getContacts();

    });

});