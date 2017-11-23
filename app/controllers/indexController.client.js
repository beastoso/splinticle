/*global ajaxFunctions, Masonry */
'use strict'; 

var appUrl = window.location.origin;
var userLoggedIn = false;
var userId = false;
var userUrl = appUrl + '/api/user';
var pinUrl = appUrl + "/api/pin";
var likeUrl = appUrl + "/api/like";
var recentUrl = appUrl + "/api/pins/recent";
var popularUrl = appUrl + "/api/pins/popular";


function showNotification(message) {
    document.getElementById("message").innerHTML = message;
    document.getElementById("notification").setAttribute("class","slideIn");
}

function createCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
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
              var bigPin = document.getElementById("viewPin");
              bigPin.setAttribute("data-id", pinData._id);
              var title = bigPin.getElementsByClassName("viewTitle")[0];
              title.textContent = pinData.title;
              var image = document.getElementById("viewImage");
              image.setAttribute("style","background-image:url('"+picUrl+"');");
              
              var userName = bigPin.getElementsByClassName("viewUserName")[0];
                userName.textContent = pinData.userName;
                var userLink = bigPin.getElementsByClassName("viewUserLink")[0];
                userLink.setAttribute("href", appUrl+"/user/"+pinData.user_id);
           
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
  
              copyPin(title, imageUrl);              
           });
       }
    }
}

function copyPin(title, imageUrl) {
   var data = {
    'title': title,
    'imageUrl': imageUrl
  };
  
  ajaxFunctions.ajaxPostRequest('POST', pinUrl, JSON.stringify(data), function(response) {
        showNotification("This pin has been copied to your wall");
  });
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

function addPin(pinData, parentElement) {
    var newPinElem = document.getElementById("dummyPin").cloneNode(true);
     newPinElem.removeAttribute("id");
     newPinElem.removeAttribute("style");
     
     populatePinElem(newPinElem, pinData);

   parentElement.appendChild(newPinElem);
}


(function () {
   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', userUrl, function(data) {
      var userObj = JSON.parse(data);
      
      var loginBtn = document.getElementById("loginBtn");
      var logoutBtn = document.getElementById("logoutBtn");
      var nameElem = document.getElementById("name");
         
      if (userObj) {
         userId = userObj._id;
         userLoggedIn = true;
         nameElem.textContent = userObj.name;
         loginBtn.setAttribute("style","display:none;");
         logoutBtn.removeAttribute("style");
         document.getElementById("viewCopyBtn").removeAttribute("style");
      }
      else {
         nameElem.textContent = "";
         logoutBtn.setAttribute("style","display:none;");
         loginBtn.removeAttribute("style");
      }
      
   }));

 ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', recentUrl, function (data) {
      var pinsObject = JSON.parse(data);
      var recentDiv = document.getElementById("recentList");
             
      if (pinsObject && Array.isArray(pinsObject) && pinsObject.length > 0) {
          pinsObject.forEach(function(pin) {
             addPin(pin, recentDiv);
          });
          
          var msnry = new Masonry( recentDiv, {
              itemSelector: '.tile',
              columnWidth: 200,
                percentPosition: true
            });
      }
      else {
          recentDiv.textContent = "No pins added yet!";
          document.getElementById("popularList").setAttribute("class","hidden");
          document.getElementById("popularList").previousSibling.setAttribute("class","hidden");
      }
   }));
   
   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', popularUrl, function (data) {
      var pinsObject = JSON.parse(data);
      var popularDiv = document.getElementById("popularList");
             
      if (pinsObject && Array.isArray(pinsObject) && pinsObject.length > 0) {
          pinsObject.forEach(function(pin) {
             addPin(pin, popularDiv);
          });
          
        var msnry = new Masonry( popularDiv, {
          itemSelector: '.tile',
          columnWidth: 200,
            percentPosition: true
        });
      }
      else {
          popularDiv.textContent = "No pins added yet!";
      }
   }));
   
   var copyBtn = document.getElementById("viewCopyBtn");
   copyBtn.addEventListener('click',function(e){
      e.preventDefault();
      var parent = e.target.parentElement.parentElement;
        var title = parent.getElementsByClassName("viewTitle")[0].textContent;
         var imageUrl = parent.getElementsByClassName("viewImage")[0].getAttribute("src");

        copyPin(title, imageUrl);
   });
   
   var closeBtn = document.getElementById("closeBtn");
    closeBtn.addEventListener('click', function(e) {
       e.preventDefault();
       document.getElementById("viewPin").setAttribute("class","hidden");
    });
   
   var msgCloseBtn = document.getElementById("msgCloseBtn");
   msgCloseBtn.addEventListener('click',function(e) {
      e.preventDefault() ;
      document.getElementById("notification").setAttribute("class","hidden");
   });
 
})();
