// Stores and manages user settings
class Settings {
  constructor(username) {
    this.username = username;
    this.auto_lock = true;
    this.background_colour = "#bcbcbc";
    this.title_colour = "#bc4d32";
    this.load_settings();
  }

  set_background_colour(colour) {
    this.background_colour = colour;
    document.body.style.background = colour;
    this.save_settings();
  }

  set_title_colour(colour) {
    this.title_colour = colour;
    document.querySelector(".page_title").style.color = colour;
    this.save_settings();
  }

  restore_defaults() {
    this.auto_lock = true;
    this.background_colour = "#bcbcbc";
    this.title_colour = "#bc4d32";
    document.body.style.background = this.background_colour;
    document.querySelector(".page_title").style.color = this.title_colour;
    this.save_settings();
  }

  load_settings() {
    let settings = localStorage.getItem(`settings_${this.username}`);
    if (settings) {
      settings = JSON.parse(settings);
      this.auto_lock = settings.auto_lock;
      this.background_colour = settings.background_colour;
      this.title_colour = settings.title_colour;
      document.body.style.background = this.background_colour;
      document.querySelector(".page_title").style.color = this.title_colour;
    } else {
      this.save_settings();
    }
  }

  save_settings() {
    let settings = {
      auto_lock: this.auto_lock,
      background_colour: this.background_colour,
      title_colour: this.title_colour
    };
    localStorage.setItem(`settings_${this.username}`, JSON.stringify(settings));
  }
}

// Represents a saved password entry
class Password {
  constructor(name, website, username_input, enc_data, description = '') {
    this.name = name;
    this.website = website;
    this.username = username_input;
    this.enc_data = enc_data;
    this.description = description;
  }
}