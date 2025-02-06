// GLOBAL VARIABLES 
var modal = document.getElementById("add_password_modal");
var add_password_button = document.getElementById("add_password_button");
var span = document.getElementsByClassName("close")[0];
var password_buttons_container = document.getElementById("password_button_container");
const saved_passwords_modal = document.getElementById("saved_passwords_modal");
const saved_passwords_div = document.getElementById("saved_passwords");
const saved_changes_button = document.getElementById("save_changes_button");

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

// enters function whenever page loads
window.onload = function() {
  // checks if local storage has passwords
  if (localStorage.getItem("password")) {
    var all_password_buttons = [];
    // loads all passwords into array
    saved_passwords = JSON.parse(localStorage.getItem("password"));
    // loops through entire array and creates a button out of each object element
    for (let index = 0; index < saved_passwords.length; index++) {
      var new_password_button = document.createElement("button");
      new_password_button.classList.add("btn", "w-100", "btn-block", "password_button");
      new_password_button.textContent = saved_passwords[index].name; // Button displays the password name
      all_password_buttons.push(new_password_button)      
    }
    // loops through each button and appends it into div container
    all_password_buttons.forEach(button => password_buttons_container.appendChild(button));
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

password_submit_button.onclick = function() {  
  // Get the form values and group values into object
  const password_name = document.getElementById("password_name").value;
  const website = document.getElementById("website").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const description = document.getElementById("description").value;
  const password_object = new Password(password_name, website, username, password, description);
  
  // Saves recently made password to the localstorage
  saved_passwords.push(password_object);
  serialised_password_array = JSON.stringify(saved_passwords);
  localStorage.setItem("password", serialised_password_array);

  // creates password button
  const new_password_button = document.createElement("button");
  new_password_button.classList.add("btn", "w-100", "btn-block", "password_button");
  new_password_button.textContent = password_name; 
  password_buttons_container.appendChild(new_password_button);// Appends the button to the container

  // create event listener for each button
  new_password_button.addEventListener("click", function () {
    saved_passwords_modal.style.display = "flex";
  })

  // Close the modal after submission 
  modal.style.display = "none";

  // Clear the form fields
  password_form.reset();
};

saved_passwords_div.addEventListener("click", function (event) {
  if (event.target.tagName === "BUTTON") {
    for (let index = 0; index < saved_passwords.length; index++) {
      if (saved_passwords[index].name == event.target.textContent) {
        const span = document.getElementById("detail_close");
        const save_button = document.getElementById("save_changes_button");

        document.getElementById("saved_passwords_modal_name").value = saved_passwords[index].name;
        document.getElementById("saved_passwords_modal_username").value = saved_passwords[index].username;  
        document.getElementById("saved_passwords_modal_passwords").value = saved_passwords[index].password;
        document.getElementById("saved_passwords_modal_website").value = saved_passwords[index].website;
        document.getElementById("saved_passwords_modal_description").value = saved_passwords[index].description;

        saved_passwords_modal.style.display = "flex";

        span.onclick = function() {
          saved_passwords_modal.style.display = "none"; 
        }

        window.onclick = function(event) {
          if (event.target == saved_passwords_modal) {
            saved_passwords_modal.style.display = "none"; 
          }
        }

        save_button.onclick = function() {
          const name_input_value = document.getElementById("saved_passwords_modal_name").value;
          const username_input_value = document.getElementById("saved_passwords_modal_username").value;
          const password_input_value = document.getElementById("saved_passwords_modal_passwords").value;
          const description_input_value = document.getElementById("saved_passwords_modal_description").value;

          saved_passwords[index].name = name_input_value;
          saved_passwords[index].username = username_input_value;
          saved_passwords[index].password = password_input_value;
          saved_passwords[index].description = description_input_value;

          event.target.textContent = saved_passwords[index].name;

          document.getElementById("saved_passwords_modal_name").value = saved_passwords[index].name;
          document.getElementById("saved_passwords_modal_username").value = saved_passwords[index].username;  
          document.getElementById("saved_passwords_modal_passwords").value = saved_passwords[index].password;
          document.getElementById("saved_passwords_modal_website").value = saved_passwords[index].website;
          document.getElementById("saved_passwords_modal_description").value = saved_passwords[index].description;

          serialised_password_array = JSON.stringify(saved_passwords);
          localStorage.setItem("password", serialised_password_array);

          saved_passwords_modal.style.display = "none";
        }        
        
        break;
      }
    }
  }
});


