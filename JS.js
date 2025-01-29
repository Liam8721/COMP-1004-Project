// GLOBAL VARIABLES 
var modal = document.getElementById("add_password_modal");
var add_password_button = document.getElementById("add_password_button");
var span = document.getElementsByClassName("close")[0];

//var saved_passwords = [];

class Password {
  constructor(name, website, username, password, description = '') {
    this.name = name;
    this.website = website;
    this.username = username;
    this.password = password;
    this.description = description;
  }
}


// once the user clicks on either of the tab buttons then this function is called passing the corresponding tab name and event
function open_tab(evt, tab_name) {
    let i, tab_content, tab_link;
  
    // HIDE ALL TAB CONTENT
    // gets all elements with class name "tab_content" and hides them (in this case password and settings)
    tab_content = document.getElementsByClassName("tab_content");
    // loops through each element in the tabcontent collection and sets the display to none
    for (i = 0; i < tab_content.length; i++) {
      tab_content[i].style.display = "none";
    }
  
    // DEACTIVATEs ALL TABS
    // gets all elements with class name "tab_link" 
    tab_link = document.getElementsByClassName("tab_link");
    // loops through each element in the tab_link collection and removes the active class
    for (i = 0; i < tab_link.length; i++) {
      tab_link[i].className = tab_link[i].className.replace(" active", "");
    }
  
    // displays tab content
    document.getElementById(tab_name).style.display = "block";
  
    // add "active" class to the clicked tab link
    evt.currentTarget.className += " active";
  }

// when user clicks the add password button the modal will display
add_password_button.onclick = function() {
  modal.style.display = "flex";
}

// when user clicks the close button the modal will close
span.onclick = function() {
  modal.style.display = "none"; 
}

// when user clicks outside of the modal the modal will also close
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none"; 
  }
}

password_form.onsubmit = function(event) {
  event.preventDefault(); // Prevent page reload
  
  // Get the form values
  var password_name = document.getElementById("password_name").value;
  var website = document.getElementById("website").value;
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  var description = document.getElementById("description").value;

  var password_object = new Password(password_name, website, username, password, description);
  
  //saved_passwords.push(password_object);

  var password_list = document.getElementById("password_list");
  var new_password = document.createElement("li");
  new_password.textContent = password_name;

    // Add the list item to the password list
    password_list.appendChild(new_password);

  // Close the modal after submission 
  modal.style.display = "none";

  // Clear the form fields
  password_form.reset();
};






/*
document.getElementById("password_list").addEventListener("click", function(event) {
  var clicked_item = event.target; // Get the clicked list item
  var password_name = clicked_item.textContent; // Get the name from the clicked item
  
  var password;

  console.log("Saved passwords:");
  saved_passwords.forEach(pwd => {
    console.log(pwd.name);
  }); 
  
  // Find the matching password object based on the name
  for (let i = 0; i < saved_passwords.length; i++) {
    if (saved_passwords[i].name === password_name) {
      password = saved_passwords[i];
      break;
    }
  }

  if (password) {
    document.getElementById("detail_name").textContent = password.name;
    document.getElementById("detail_website").textContent = password.website;
    document.getElementById("detail_username").textContent = password.username;
    document.getElementById("detail_password").textContent = password.password;
    
    // Display the modal with password details
    var saved_passwords_modal = document.getElementById("saved_passwords_modal");
    saved_passwords_modal.style.display = "block";
    
    // Close the modal when the close button is clicked
    var detail_close = document.getElementById("detail_close");
    detail_close.onclick = function () {
      saved_passwords_modal.style.display = "none";
    };
} else {
    alert("Password not found");
  }
});
*/