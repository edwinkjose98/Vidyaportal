/* Kerala Vidya Portal - Config & Restoration */
const STORAGE_KEY = "unicircle_user";
const ADMIN_EMAILS = ["edwinkjose98@gmail.com"];

window.showToast = function(msg) {
    let t = document.getElementById("toast");
    if (!t) {
        t = document.createElement("div");
        t.id = "toast";
        t.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:20px;z-index:10000;display:none;";
        document.body.appendChild(t);
    }
    t.innerHTML = '<span style="color:#9000FF">✦</span> ' + msg;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 3000);
}

// RESTOREsaveUserToStorage
window.saveUserToStorage = function(user, profile = null) {
  if (!user) return;
  try {
    const data = {
      uid: user.uid,
      displayName: (profile && profile.displayName) || user.displayName || "",
      email: (profile && profile.email) || user.email || "",
      phone: (profile && profile.phone) || user.phoneNumber || "",
      profile: (profile) ? true : false 
    };
    localStorage.setItem("unicircle_user", JSON.stringify(data));
  } catch (e) {
    console.warn("localStorage save failed", e);
  }
}
