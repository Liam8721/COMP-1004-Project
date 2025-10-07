// Manages user accounts, authentication, and recovery
class User_Manager {
  constructor() {
    this.users = [];
    this.current_user = null;
  }

  static check_password_requirements(password) {
    return PasswordUtils.checkRequirements(password);
  }

  static check_username_requirements(username) {
    const existing_user = localStorage.getItem(`user_${username}`);
    if (existing_user) {
      NotificationManager.error("Username already exists. Please choose a different username.");
      return false;
    }
    return true;
  }

  static async retrieve_username_by_recovery_key(recovery_key) {
    const all_users = localStorage.getItem("accounts");
    if (!all_users) {
      NotificationManager.error("No accounts found");
      return false;
    }

    const users = JSON.parse(all_users);
    
  // Hash the recovery key for secure comparison
    const provided_key_hash = Array.from(new Uint8Array(
      await Crypto_Web_API.hash_data(recovery_key)
    ));
    
  // Find user with matching recovery key hash
    for (const user of users) {
      let keyMatches = false;
      
  // Secure method: compare recovery key hashes
      if (user.recovery_key_hash) {
        keyMatches = Crypto_Web_API.compare_hashes(user.recovery_key_hash, provided_key_hash);
      }
  // Fallback: decrypt recovery key for legacy accounts
      else if (user.encrypted_recovery_data && user.combined_answers_hash) {
        try {
          const stored_recovery_key = await Crypto_Web_API.decrypt_recovery_key(
            user.encrypted_recovery_data, 
            user.combined_answers_hash
          );
          keyMatches = (stored_recovery_key === recovery_key);
        } catch (error) {
          continue;
        }
      }
      
      if (keyMatches) {
        NotificationManager.success(`Your username is ${user.username}`);
        return true;
      }
    }
    
    NotificationManager.error("Invalid recovery key. Please check your recovery key and try again.");
    return false;
  }

  static async find_user_by_recovery_key(recovery_key) {
    const all_users = localStorage.getItem("accounts");
    if (!all_users) {
      NotificationManager.error("No accounts found");
      return null;
    }

    const users = JSON.parse(all_users);
    
  // Hash the recovery key for secure comparison
    const provided_key_hash = Array.from(new Uint8Array(
      await Crypto_Web_API.hash_data(recovery_key)
    ));
    
  // Find user with matching recovery key hash
    for (const user_data of users) {
  // Try both hash comparison and decryption for compatibility
      let keyMatches = false;
      
  // Secure method: compare recovery key hashes
      if (user_data.recovery_key_hash) {
        keyMatches = Crypto_Web_API.compare_hashes(user_data.recovery_key_hash, provided_key_hash);
      }
  // Fallback: decrypt recovery key for legacy accounts
      else if (user_data.encrypted_recovery_data && user_data.combined_answers_hash) {
        try {
          const stored_recovery_key = await Crypto_Web_API.decrypt_recovery_key(
            user_data.encrypted_recovery_data, 
            user_data.combined_answers_hash
          );
          keyMatches = (stored_recovery_key === recovery_key);
        } catch (error) {
          // If decryption fails, skip to next user
          continue;
        }
      }
      
      if (keyMatches) {
  // Return reconstructed user object
        const user = new Account(
          user_data.username, 
          user_data.security_question_1, 
          user_data.security_question_2
        );
        
        user.saved_passwords = [];
        user.passwordHash = new Uint8Array(Object.values(user_data.passwordHash));
        user.recovery_key_hash = user_data.recovery_key_hash;
        user.combined_answers_hash = user_data.combined_answers_hash;
        user.encrypted_recovery_data = user_data.encrypted_recovery_data;
        user.settings = user.settings || new Settings();
        
        return user;
      }
    }
    
    NotificationManager.error("Invalid recovery key. Please check your recovery key and try again.");
    return null;
  }

  async create_user(username_input, password_input, security_question_1, security_question_2, security_answer_1, security_answer_2) {
    const new_user = new Account(username_input, security_question_1, security_question_2);
    await new_user.initialise_hashes(password_input, security_answer_1, security_answer_2);

    localStorage.setItem(`user_${username_input}`, JSON.stringify(new_user));
    this.current_user = new_user;
    this.users.push(new_user);
    this.save_users();
    this.current_user.save_passwords();
  }

  async login(username_input, password) {
    const hash = new Uint8Array(await Crypto_Web_API.hash_data(password));
    
    for (const user of this.users) {
      if (user.username === username_input && Crypto_Web_API.compare_hashes(user.passwordHash, hash)) {
        this.current_user = user;
        return;
      }
    }
  }

  logout() {
    this.current_user = null;
  }

  add_password_to_current_user(name, website, username_input, password, description = '') {
    this.current_user.add_password(name, website, username_input, password, description);
    this.save_users();
  }

  save_users() {
    localStorage.setItem("accounts", JSON.stringify(this.users));
  }

  check_username(username_input) {
    if (!username_input) {
      NotificationManager.error("Please enter a username");
      return false;
    }
    
    let user = localStorage.getItem(`user_${username_input}`);
    if (user) {
      user = JSON.parse(user);
      Object.assign(new Account, user);
      Object.setPrototypeOf(user, Account.prototype);
      this.current_user = user;
      return true;
    }
    
    NotificationManager.error("Username not found");
    return false;
  }

  async check_security_answers(answer_1, answer_2) {
    const combined_hash = Array.from(new Uint8Array(
      await Crypto_Web_API.hash_data(answer_1 + answer_2)
    ));

    if (!this.current_user) {
      const all_users = localStorage.getItem("accounts");
      if (!all_users) {
        NotificationManager.error("No accounts found");
        return false;
      }

      const users = JSON.parse(all_users);
      const matchingUser = users.find(user => 
        Crypto_Web_API.compare_hashes(user.combined_answers_hash, combined_hash)
      );

      if (!matchingUser) {
        NotificationManager.error("Incorrect security answers");
        return false;
      }
      
      this.current_user = matchingUser;
    }

    if (!this.current_user) {
      NotificationManager.error("Incorrect answers. Please try again.");
      return false;
    }

    if (!Crypto_Web_API.compare_hashes(combined_hash, this.current_user.combined_answers_hash)) {
      return false;
    }

    const recovery_key_plaintext = await Crypto_Web_API.decrypt_recovery_key(
      this.current_user.encrypted_recovery_data, 
      combined_hash
    );
    
    sessionStorage.setItem("recovery_key", recovery_key_plaintext);
    setTimeout(() => sessionStorage.removeItem('recovery_key'), CONSTANTS.RECOVERY_TIMEOUT);
    return true;
  }

  load_accounts() {
    const accounts = localStorage.getItem("accounts");
    if (!accounts) return;

    const saved_users = JSON.parse(accounts);
    for (const user_data of saved_users) {
      const user = new Account(
        user_data.username, 
        user_data.security_question_1, 
        user_data.security_question_2
      );
      
      user.saved_passwords = [];
      user.passwordHash = new Uint8Array(Object.values(user_data.passwordHash));
      user.recovery_key_hash = user_data.recovery_key_hash || null;
      user.combined_answers_hash = user_data.combined_answers_hash || null;
      user.encrypted_recovery_data = user_data.encrypted_recovery_data || null;
      user.settings = user.settings || new Settings();
      this.users.push(user);
    }
  }
}