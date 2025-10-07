// Represents a user account and manages password operations
class Account {
  constructor(username_input, security_question_1, security_question_2) {
    this.security_question1 = security_question_1;
    this.security_question2 = security_question_2;
    this.username = username_input;
    this.security_questions_container = [this.security_question1, this.security_question2];
    this.saved_passwords = [];
    this.settings = new Settings(this.username);
  }

  async initialise_hashes(password, security_answer_1, security_answer_2) {
    this.passwordHash = Array.from(new Uint8Array(
      await Crypto_Web_API.hash_data(password)
    ));

    this.combined_answers_hash = Array.from(new Uint8Array(
      await Crypto_Web_API.hash_data(security_answer_1 + security_answer_2)
    ));

    await this.generate_recovery_key();
  }

  async generate_recovery_key() {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    this.recovery_key = await Crypto_Web_API.create_recovery_key(this.passwordHash, salt);

  // Save hash of recovery key for secure username recovery
    this.recovery_key_hash = Array.from(new Uint8Array(
      await Crypto_Web_API.hash_data(this.recovery_key)
    ));

    NotificationManager.success(`Account created successfully. Your security code is ${this.recovery_key}. You MUST remember this code for account recovery if credentials are forgotten. Please place this code somewhere safe`);

    this.encrypted_recovery_data = await Crypto_Web_API.encrypt_recovery_key(this.combined_answers_hash, salt, this.recovery_key);
    this.encrypted_recovery_data.salt = Array.from(salt);
    this.recovery_key = null;
  }

  async validate_password_match(password, confirm_password) {
    if (password === confirm_password && password && confirm_password) {
      await this.reset_password(password);
      return true;
    } else {
      NotificationManager.error("Passwords do not match. Please try again.");
      return false;
    }
  }

  async reset_password(new_password) {
    const recovery_key = sessionStorage.getItem("recovery_key");
    sessionStorage.removeItem("recovery_key");

    if (!recovery_key) {
      NotificationManager.error("Session expired. Restart recovery.");
      return;
    }

    const new_password_hash = Array.from(new Uint8Array(
      await Crypto_Web_API.hash_data(new_password)
    ));

    this.passwordHash = new_password_hash;

    const salt = crypto.getRandomValues(new Uint8Array(16));
    this.recovery_key = await Crypto_Web_API.create_recovery_key(this.passwordHash, salt);

  // Update recovery key hash after password reset
    this.recovery_key_hash = Array.from(new Uint8Array(
      await Crypto_Web_API.hash_data(this.recovery_key)
    ));

    this.encrypted_recovery_data = await Crypto_Web_API.encrypt_recovery_key(this.combined_answers_hash, salt, this.recovery_key);
    this.encrypted_recovery_data.salt = Array.from(salt);

    const all_users = JSON.parse(localStorage.getItem("accounts"));
    for (let i = 0; i < all_users.length; i++) {
      if (all_users[i].username == user_manager.current_user.username) {
        all_users[i].passwordHash = this.passwordHash;
        all_users[i].encrypted_recovery_data = this.encrypted_recovery_data;
        all_users[i].recovery_key_hash = this.recovery_key_hash;
        break;
      }
    }
    localStorage.setItem("accounts", JSON.stringify(all_users));

    const user_data = JSON.parse(localStorage.getItem(`user_${user_manager.current_user.username}`));
    user_data.passwordHash = this.passwordHash;
    user_data.encrypted_recovery_data = this.encrypted_recovery_data;
    user_data.recovery_key_hash = this.recovery_key_hash;
    localStorage.setItem(`user_${user_manager.current_user.username}`, JSON.stringify(user_data));

    NotificationManager.success("Password reset successful. You can now log in with your new password.");
    NotificationManager.warning(`Please remember your new recovery key for future reference. It is important for account recovery. ${this.recovery_key}`);

    this.recovery_key = null;
  }

  async #deriveKey(salt) {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(this.passwordHash),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async encryptPassword(plaintext) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.#deriveKey(salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plaintext)
    );

    return {
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(encrypted)),
      salt: Array.from(salt)
    };
  }

  async decryptPassword(encryptedData) {
    const key = await this.#deriveKey(new Uint8Array(encryptedData.salt));

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(encryptedData.iv) },
      key,
      new Uint8Array(encryptedData.ciphertext)
    );

    return new TextDecoder().decode(decrypted);
  }

  async add_password(name, website, username_input, password, description = '') {
    const encrypted = await this.encryptPassword(password);
    const new_password = new Password(name, website, username_input, encrypted, description);
    this.saved_passwords.push(new_password);
    this.save_passwords();
  }

  save_passwords() {
    localStorage.setItem(`user_${this.username}_passwords`, JSON.stringify(this.saved_passwords));
  }

  delete_password(index) {
    this.saved_passwords.splice(index, 1);
    this.save_passwords();
  }

  load_passwords() {
    const saved_passwords = localStorage.getItem(`user_${this.username}_passwords`);
    if (saved_passwords) {
      this.saved_passwords = JSON.parse(saved_passwords);
      this.saved_passwords.forEach(async (password) => {
        password.enc_data.salt = new Uint8Array(password.enc_data.salt);
        password.enc_data.iv = new Uint8Array(password.enc_data.iv);
        password.enc_data.ciphertext = new Uint8Array(password.enc_data.ciphertext);
      });
    } else {
      this.saved_passwords = [];
    }
  }
}