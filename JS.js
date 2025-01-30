// GLOBAL VARIABLES 
var modal = document.getElementById("add_password_modal");
var add_password_button = document.getElementById("add_password_button");
var span = document.getElementsByClassName("close")[0];

var saved_passwords = [];

class Password {
  constructor(name, website, username, password, description = '') {
    this.name = name;
    this.website = website;
    this.username = username;
    this.password = password;
    this.description = description;
  }
}
window.onload = function() {
  // Retrieve saved passwords from localStorage
  var storedPasswords = localStorage.getItem("password");
  if (storedPasswords) {
    // Parse the stored data into an array of Password objects
    saved_passwords = JSON.parse(storedPasswords);

    // Generate the password buttons dynamically
    renderSavedPasswords();
  }
};


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
  
  // Get the form values and group values into object
  var password_name = document.getElementById("password_name").value;
  var website = document.getElementById("website").value;
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  var description = document.getElementById("description").value;
  var password_object = new Password(password_name, website, username, password, description);
  
  // Saves recently made password to the localstorage
  saved_passwords.push(password_object);
  serialised_password_array = JSON.stringify(saved_passwords);
  localStorage.setItem("password", serialised_password_array);

  var password_buttons_container = document.getElementById("password_button_container");
  var new_password_button = document.createElement("button");
  new_password_button.classList.add("btn", "w-100", "btn-block", "password_button");
  new_password_button.textContent = password_name; // Button displays the password name

  // Add the button to the container
  password_buttons_container.appendChild(new_password_button);

  // Close the modal after submission 
  modal.style.display = "none";

  // Clear the form fields
  password_form.reset();
};

