/*global $,ajaxFunctions,Masonry*/
'use strict';

var appUrl = window.location.origin;
var userId = false;
var displayUserId = window.location.pathname.replace("/user/","");
var userUrl = appUrl + "/api/user";
var followedUrl = appUrl + "/api/user/fellows/"+displayUserId;
var userPinUrl = appUrl + "/api/user/pins/"+displayUserId;
var followUrl = appUrl + "/api/follow/";
var likeUrl = appUrl + "/api/like";
var pinUrl = appUrl + "/api/pin";

function showNotification(message) {
    document.getElementById("message").innerHTML = message;
    document.getElementById("notification").setAttribute("class","slideIn");
}

function formatDate(dateStr) {
   var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
   
   var date = new Date(dateStr);
   return (date.getDate()+1)+"-"+months[date.getMonth()]+"-"+date.getFullYear().toString().substr(2);
}

function removePin(pinId) {
   ajaxFunctions.ajaxRequest('DELETE', pinUrl+"/"+pinId, function() {
      document.getElementById("newPin").setAttribute("class","hidden");
      
     var pins = document.getElementsByClassName("tile");
     for (var i = 0; i < pins.length; i++) {
        if (pins[i].getAttribute("data-id") == pinId) {
           pins[i].parentElement.removeChild(pins[i]);
           break;
        }
     }
   });
}

function removeFellow(userId) {
   ajaxFunctions.ajaxRequest('DELETE', followUrl+userId, function() {
      
     var pins = document.getElementsByClassName("fellow");
     for (var i = 0; i < pins.length; i++) {
        if (pins[i].getAttribute("data-userid") == userId) {
           pins[i].parentElement.removeChild(pins[i]);
           break;
        }
     }
   });
}

function addLike(pinId) {
   ajaxFunctions.ajaxPostRequest('POST', likeUrl+"/"+pinId, null, function() {
      var pins = document.getElementsByClassName("pin");
     for (var i = 0; i < pins.length; i++) {
        if (pins[i].getAttribute("data-id") == pinId) {
           var currentCount = pins[i].parentElement.getElementsByClassName("likesCount").textContent;
           pins[i].parentElement.getElementsByClassName("likesCount").textContent = (Number(currentCount) +1).toString();
           break;
        }
     }
   });
}

function imgError(image) {
    image.src = "/public/img/pic-broken.png";
    return true;
}

function populatePinElem(pinElem, pinData) {
    var isNew = false;
    if (pinElem.getAttribute("data-id")) {
        isNew = true;
    }
    else {
      pinElem.setAttribute("data-id",pinData._id);
      pinElem.setAttribute("data-userid",pinData.user_id);
    }
   if (pinData.image_url) {
        var imageElem = pinElem.getElementsByClassName("image")[0];
        imageElem.setAttribute("src", pinData.image_url);
    }
    if (pinData.title) {
        var nameElem = pinElem.getElementsByClassName("title")[0];
        nameElem.textContent = pinData.title;
    }
    if (pinData.likes) {
        var likesElem = pinElem.querySelector("input[name=likesCount]");
        likesElem.value = pinData.likes;
    }
    
    if (!isNew) {
        var viewBtn = pinElem.getElementsByClassName("image")[0];
        viewBtn.addEventListener('click', function(e){
              e.preventDefault();
              var picUrl = e.target.getAttribute("src");
              var bigPin = document.getElementById("newPin");
              bigPin.setAttribute("data-id", pinData._id);
              var title = bigPin.getElementsByClassName("newTitle")[0];
              title.textContent = pinData.title;
              var image = document.getElementById("newImage");
              image.setAttribute("style","background-image:url('"+picUrl+"');");
              var titleField = bigPin.querySelector("input[name=title]");
              titleField.value = pinData.title;
              var imageField = bigPin.querySelector("input[name=imageUrl");
              imageField.value = pinData.image_url;
              
              var idField = bigPin.querySelector("input[name=pinId");
              idField.value = pinData._id;
              
              if (isOwnProfile()) {
                  var viewRemoveBtn = document.getElementById("viewRemoveBtn");
                  viewRemoveBtn.removeAttribute("style");
              }
              
              if (pinData.user_id == userId) {
                  titleField.removeAttribute("disabled");
                  imageField.removeAttribute("disabled");
                  document.getElementById("saveBtn").textContent = "Save";
              }
              
              bigPin.querySelector("input[name=likesCount]").removeAttribute("style");
              document.getElementById("likeBtn").removeAttribute("style");
              
              bigPin.setAttribute("class","slideIn");
       });
       
       var likeBtn = pinElem.getElementsByClassName("likeBtn")[0];
       likeBtn.addEventListener('click', function(e){
          e.preventDefault();
          var tile = e.target.parentElement.parentElement.parentElement;
          var pinId = tile.getAttribute("data-id")
          var likeCount = tile.querySelector("input[name=likesCount]");
          likeCount.value = Number(likeCount.value)+1;
          
          addLike(pinId);
       });
       
       
       var copyBtn = pinElem.getElementsByClassName("copyBtn")[0];
       if (pinData.user_id == userId) {
          copyBtn.setAttribute("style","display:none;");
       }
       else if (userId) {
           copyBtn.removeAttribute("style");
           copyBtn.addEventListener('click', function(e){
              e.preventDefault();
              var parent = e.target.parentElement.parentElement.parentElement;
              
              var title = parent.getElementsByClassName("title")[0].textContent;
              var imageUrl = parent.getElementsByClassName("image")[0].getAttribute("src");
              
              var data = {
                'title': title,
                'imageUrl': imageUrl
              };
              
              ajaxFunctions.ajaxPostRequest('POST', pinUrl, JSON.stringify(data), function(response) {
                  if (isOwnProfile()) {
                      var pinData = JSON.parse(response);
                      if (pinData) {
                          addPin(pinData);
                          activateMasonry();
                      }
                  }
                  else {
                      showNotification("This pin has been copied to your wall");
                  }
              });              
           });
       }
    }
}

function isOwnProfile() {
    return (userId && userId == displayUserId);
}

function updatePin(pinData) {
    var pins = document.getElementsByClassName("tile");
    for(var i = 0; i < pins.length; i++) {
        var id = pins[i].getAttribute("data-id");
        if (id && id == pinData._id) {
            populatePinElem(pins[i], pinData);
        }
    }
}

function addPin(pinData) {
    var newPinElem = document.getElementById("dummyPin").cloneNode(true);
     newPinElem.removeAttribute("id");
     newPinElem.removeAttribute("style");
     
     populatePinElem(newPinElem, pinData);

    var removeBtn = newPinElem.getElementsByClassName("removeBtn")[0];
    removeBtn.addEventListener('click', function(e){
       e.preventDefault();
       var parent = e.target.parentElement.parentElement;
       var pinId = parent.getAttribute("data-id");
       removePin(pinId);
    });
       
    var pinsDiv = document.getElementById("pins");
    var addBtn = document.getElementById("addTile");
    pinsDiv.removeChild(addBtn);
    pinsDiv.appendChild(newPinElem);
    pinsDiv.appendChild(addBtn); //makes sure this stays last
}

function addFellow(fellowData) {
    var fellowElem = document.getElementById("dummyFellow").cloneNode(true);
     fellowElem.removeAttribute("id");
     fellowElem.removeAttribute("style");
     
     populatePinElem(fellowElem, fellowData.latestPin);
     
    var userName = fellowElem.getElementsByClassName("userName")[0];
    userName.textContent = fellowData.name;
    var userLink = fellowElem.getElementsByClassName("userLink")[0];
    userLink.setAttribute("href", appUrl+"/user/"+fellowData.user_id);
     
    var removeBtn = fellowElem.getElementsByClassName("removeFellowBtn")[0];
    removeBtn.addEventListener('click', function(e){
       e.preventDefault();
       var parent = e.target.parentElement.parentElement;
       var fellowId = parent.getAttribute("data-userid")
       removeFellow(fellowId);
    });
       
    var followingDiv = document.getElementById("following");
    followingDiv.appendChild(fellowElem);
}

function activateMasonry() {
    var pinsDiv = document.getElementById("pins");
  var msnry = new Masonry( pinsDiv, {
  // options
      itemSelector: '.tile',
      columnWidth: 200,
        percentPosition: true
    });
}

(function () {

   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', userUrl, function(data) {
      var userObject = JSON.parse(data);
      
      var loginBtn = document.getElementById("loginBtn");
      var logoutBtn = document.getElementById("logoutBtn");
      var nameElem = document.getElementById("name");
         
      if (userObject) {
          userId = userObject._id;
         nameElem.textContent = userObject.name;
         loginBtn.setAttribute("style","display:none;");
         logoutBtn.removeAttribute("style");
      
        if (isOwnProfile()) {
            var removeBtns = document.getElementsByClassName("removeBtn");
            for (var i = 0; i < removeBtns.length; i++) {
                removeBtns[i].removeAttribute("style");
            }
            var addBtn = document.getElementById("addTile");
            addBtn.removeAttribute("style");
            
            var removeFellowBtns = document.getElementsByClassName("removeFellowBtn");
            for (var i = 0; i < removeFellowBtns.length; i++) {
                removeFellowBtns[i].removeAttribute("style");
            }
        }
        else {
            document.getElementById("homeBtn").removeAttribute("style");
            var followBtn = document.getElementById("followBtn");
            followBtn.removeAttribute("style");
        }
      }
      else {
         nameElem.textContent = "";
         logoutBtn.setAttribute("style","display:none;");
         loginBtn.removeAttribute("style");
      }
      
   }));
   
   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', userUrl+"/"+displayUserId, function(data) {
      var userObject = JSON.parse(data);
      
      if (userObject) {
         
        if (!isOwnProfile()) {
            if (userObject.following) {
                document.getElementById("followBtn").setAttribute("style","display:none");
            }
            document.getElementById("userName").textContent = userObject.name;
        }
        else {
            document.getElementById("prefix").textContent = "You have ";
        }
        
        document.querySelector("input[name=followCount]").value = userObject.followers;
      }

   }));
   
   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', userPinUrl, function (data) {
      var pinsObject = JSON.parse(data);
      var pinsDiv = document.getElementById("pins");
      
      if (pinsObject && Array.isArray(pinsObject) && pinsObject.length > 0) {
          pinsObject.forEach(function(pin) {
             addPin(pin);
          });
          
          activateMasonry();
      }
      else {
          document.getElementById("statusMessage").innerHTML = "<br/><p>No pins added yet!</p><br />";
      }
   }));
   
   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', followedUrl, function (data) {
      var pinsObject = JSON.parse(data);
      var pinsDiv = document.getElementById("following");
      
      if (pinsObject && Array.isArray(pinsObject) && pinsObject.length > 0) {
          pinsObject.forEach(function(pin) {
             addFellow(pin);
          });
          
          pinsDiv.removeAttribute("class");
      }
   }));
   
   
   var removeBtn = document.getElementById("viewRemoveBtn");
   removeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      var pinId = e.target.parentElement.getAttribute("data-id");
      
      removePin(pinId);
   });
   
   var closeBtn = document.getElementById("closeBtn");
   closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById("newPin").setAttribute("class","hidden");
   });
   
   var imageField = document.querySelector("input[name=imageUrl]");
  imageField.addEventListener('focusout',function() {
     var url = imageField.value;
     if (url && url != "") {
         var testImage = document.getElementById("testImage");
         testImage.setAttribute("src",url);
         setTimeout(function() {
             var testedUrl = testImage.getAttribute("src");
            var image = document.getElementById("newImage");
            image.setAttribute("style","background-image:url('"+testedUrl+"');");
         }, 1500);
     }
  });
  
  var addBtn = document.getElementById('addTile');
  addBtn.addEventListener('click', function(e) {
     e.preventDefault();
     
     var newModal = document.getElementById("newPin");
     newModal.getElementsByClassName("newTitle").textContent = "New pin";
     var defaultImage = appUrl+"/public/img/pic-placeholder.png";
     document.getElementById("newImage").setAttribute("style","background-image:url('"+defaultImage+"')");
     document.getElementById("saveBtn").textContent = "Add";
      document.querySelector("input[name=imageUrl]").value = "";
      document.querySelector("input[name=imageUrl]").removeAttribute("disabled");
      document.querySelector("input[name=title]").value = "";
      document.querySelector("input[name=title]").removeAttribute("disabled");
      newModal.querySelector("input[name=likesCount]").setAttribute("style","display:none;");
      document.getElementById("likeBtn").setAttribute("style","display:none;");
     newModal.setAttribute("class","slideIn");
  });

  var saveBtn = document.getElementById('saveBtn');
  saveBtn.addEventListener('click', function(e) {
     e.preventDefault();
     
     var data = {
         imageUrl: document.querySelector("input[name=imageUrl]").value,
         title: document.querySelector("input[name=title]").value,
     };
     
     var pinId = document.querySelector("input[name=pinId]").value;
     if (pinId != "") {
        data.pinId = pinId;
     }
     
     ajaxFunctions.ajaxPostRequest('POST', pinUrl, JSON.stringify(data), function(response) {
         document.getElementById("newPin").setAttribute("class","hidden");
         var savedPin = JSON.parse(response);
         if (savedPin) {
             if (pinId != "") {
                 updatePin(savedPin);
             }
             else {
                 addPin(savedPin);
                 activateMasonry();
             }
         }
     });
  });
  
  var followBtn = document.getElementById("followBtn");
  followBtn.addEventListener('click', function(e){
     e.preventDefault();
     
     ajaxFunctions.ajaxPostRequest('POST', followUrl+displayUserId, null, function(response) {
         var name = document.getElementById("userName").textContent;
         showNotification("You are now following "+name);
        var countFld = document.querySelector("input[name=followCount]");
        countFld.value = Number(countFld.value)+1;
        document.getElementById("followBtn").setAttribute("style","display:none;");
     });
  });
  
  var closeMsgBtn = document.getElementById("msgCloseBtn");
  closeMsgBtn.addEventListener('click', function() {
      document.getElementById("notification").setAttribute("class","hidden");
  });
  
  
})();
