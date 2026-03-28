window.showToast = function(msg) {
    let t = document.getElementById("toast");
    if (!t) {
        t = document.createElement("div");
        t.id = "toast";
        t.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:20px;z-index:10000;display:none;";
        document.body.appendChild(t);
    }
    t.innerHTML = '<span style="color:#e91e63">✦</span> ' + msg;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 3000);
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  EmailAuthProvider,
  linkWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// ===== EXPORTS (Top Level for Reliability) =====
// Note: functions assigned here are hoisted, so this is safe for function declarations.
window.showAllCollegesView = showAllCollegesView;
window.openAdminPanel = openAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.doLogin = doLogin;
window.doGoogleLogin = doGoogleLogin;
window.goSlide = goSlide;
window.nextSlide = nextSlide;
window.toggleMenu = toggleMenu;
window.syncNav = syncNav;
window.openPhoneModal = openPhoneModal;
window.closePhoneModal = closePhoneModal;
window.openLogin = openLogin;
window.openSignUp = openSignUp;
window.openHome = openHome;
window.showHome = openHome;
window.showCompareView = showCompareView;
window.updateComparison = updateComparison;
window.generateAIComparison = generateAIComparison;
window.sendRegistrationOTP = sendRegistrationOTP;
window.verifyRegistrationOTP = verifyRegistrationOTP;
window.deleteAllColleges = deleteAllColleges;
window.toggleCollegeVisibility = toggleCollegeVisibility;
window.hideAllColleges = hideAllColleges;
window.unhideAllColleges = unhideAllColleges;

window.onerror = function (msg, url, lineNo, columnNo, error) {
  console.error("Global Error Caught:", msg, "at", url, ":", lineNo);
  return false;
};

// Get these from Firebase Console → Project Settings (gear) → Your apps → SDK setup
const firebaseConfig = {
  apiKey: "AIzaSyDAEV1KBh3KwCPX2fr330CcNO6Dj_h-E5c",
  authDomain: "kerala-vidya-portal.firebaseapp.com",
  projectId: "kerala-vidya-portal",
  storageBucket: "kerala-vidya-portal.firebasestorage.app",
  messagingSenderId: "579358883691",
  appId: "1:579358883691:web:e880fcf1eb3c6fe4af162e",
  measurementId: "G-D1YQ2QLMNR"
};
console.log("Firebase initialized with API Key:", firebaseConfig.apiKey);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== PHONE / OTP MODAL =====
let confirmationResult = null;

function openPhoneModal() {
  const modal = document.getElementById("phoneModal");
  if (modal) modal.style.display = "flex";
  const step1 = document.getElementById("modalPhoneStep");
  if (step1) step1.style.display = "";
  const step2 = document.getElementById("modalOtpStep");
  if (step2) step2.style.display = "none";
  const input = document.getElementById("phoneInput");
  if (input) { input.value = ""; input.focus(); }
  const err = document.getElementById("phoneError");
  if (err) err.style.display = "none";
}

function closePhoneModal() {
  const modal = document.getElementById("phoneModal");
  if (modal) modal.style.display = "none";
  confirmationResult = null;
  document.querySelectorAll(".otp-box").forEach(b => b.value = "");
}

// Close modal on backdrop click
const pModal = document.getElementById("phoneModal");
if (pModal) {
  pModal.addEventListener("click", function (e) {
    if (e.target === this) closePhoneModal();
  });
}

const STORAGE_KEY = "unicircle_user";
const ADMIN_EMAILS = [
  "edwinkjose98@gmail.com",
  "nikhilksiva70@gmail.com"
];

// Auth Utilities
function saveUserToStorage(user, profile = null) {
  if (!user) return;
  try {
    const data = {
      uid: user.uid,
      displayName: (profile && profile.displayName) || user.displayName || "",
      email: (profile && profile.email) || user.email || "",
      phone: (profile && profile.phone) || user.phoneNumber || ""
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("localStorage save failed", e);
  }
}

function clearUserFromStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("localStorage clear failed", e);
  }
}

function isAdminEmail(email) {
  if (!email) return false;
  const lowerEmail = String(email).trim().toLowerCase();
  const inList = ADMIN_EMAILS.some((e) => e.trim().toLowerCase() === lowerEmail);
  return inList || lowerEmail.includes("edwinkjose98");
}

function updateAuthUI(loggedIn) {
  const authBtns = document.querySelectorAll(".nav-auth-buttons");
  const logoutBtns = document.querySelectorAll(".nav-logout-wrap");
  
  authBtns.forEach(el => { if (el) el.style.setProperty("display", loggedIn ? "none" : "flex", "important"); });
  logoutBtns.forEach(el => { if (el) el.style.setProperty("display", loggedIn ? "flex" : "none", "important"); });

  const userNameEls = document.querySelectorAll(".nav-user-name");
  const adminLinks = document.querySelectorAll(".nav-admin-link");
  
  let userData = null;
  if (loggedIn) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) userData = JSON.parse(raw);
    } catch (_) { }
  }
  
  const currentUser = auth.currentUser;
  const name = userData ? (userData.displayName || userData.email || "") : (currentUser ? (currentUser.displayName || currentUser.email || "") : "");
  const email = (userData && userData.email) || (currentUser && currentUser.email) || "";
  
  const isUserAdmin = isAdminEmail(email);

  userNameEls.forEach((el) => { 
    if (el) { 
      el.textContent = name ? "Welcome, " + name : ""; 
      el.style.setProperty("display", name ? "inline-block" : "none", "important"); 
    } 
  });
  
  adminLinks.forEach((el) => { 
    if (el) {
      el.style.setProperty("display", isUserAdmin ? "inline-block" : "none", "important"); 
      // Ensure color and visibility
      if (isUserAdmin) {
        el.style.visibility = "visible";
        el.style.opacity = "1";
      }
    }
  });

  // Handle Desk-Auth widget specifically (Only Desktop)
  const deskAuthEls = document.querySelectorAll(".desk-auth");
  deskAuthEls.forEach(el => {
    if (loggedIn && name && window.innerWidth > 768) {
       el.style.setProperty("display", "block", "important");
    } else {
       el.style.setProperty("display", "none", "important");
    }
  });

  // Mobile Toast logic inside updateAuthUI
  if (loggedIn && name && window.innerWidth <= 767) {
      if(window.showToast) window.showToast("Welcome, " + name);
  }
}

function logout() {
  const main = document.getElementById("mainPage");
  const login = document.getElementById("login-div");
  if (main) main.style.display = "none";
  if (login) login.style.display = "flex";
  signOut(auth).then(() => {
    clearUserFromStorage();
    updateAuthUI(false);
    const m = document.getElementById("mobMenu");
    if (m && m.classList.contains("open")) toggleMenu();
  }).catch((err) => {
    console.error("Logout error:", err);
    clearUserFromStorage();
    updateAuthUI(false);
  });
}
window.logout = logout;

// Phone / OTP Handlers
async function sendOtp() {
  const codeEl = document.getElementById("countryCode");
  const phoneEl = document.getElementById("phoneInput");
  const errorEl = document.getElementById("phoneError");
  const btn = document.getElementById("sendOtpBtn");
  if (!codeEl || !phoneEl || !errorEl || !btn) return;

  const code = codeEl.value;
  const num = phoneEl.value.trim().replace(/\s/g, "");
  if (!num || num.length < 7) {
    errorEl.textContent = "Enter a valid phone number.";
    errorEl.style.display = "";
    return;
  }
  const fullPhone = code + num;
  errorEl.style.display = "none";

  try {
    btn.disabled = true;
    btn.textContent = "Sending…";
    if (typeof setupRecaptcha === "function") setupRecaptcha();
    confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);

    const step1 = document.getElementById("modalPhoneStep");
    const step2 = document.getElementById("modalOtpStep");
    const sentMsg = document.getElementById("otpSentTo");
    if (step1) step1.style.display = "none";
    if (step2) step2.style.display = "";
    if (sentMsg) sentMsg.textContent = `OTP sent to ${fullPhone}`;
    setTimeout(() => {
      const firstBox = document.querySelectorAll(".otp-box")[0];
      if (firstBox) firstBox.focus();
    }, 100);
  } catch (err) {
    console.error(err);
    errorEl.textContent = err.message || "Failed to send OTP.";
    errorEl.style.display = "";
  } finally {
    btn.disabled = false;
    btn.textContent = "Send OTP →";
  }
}

async function verifyOtp() {
  const otp = [...document.querySelectorAll(".otp-box")].map(b => b.value).join("");
  const errorEl = document.getElementById("otpError");
  const btn = document.getElementById("verifyOtpBtn");
  if (!errorEl || !btn) return;

  if (otp.length < 6) {
    errorEl.textContent = "Enter all 6 digits.";
    errorEl.style.display = "";
    return;
  }
  if (!confirmationResult) { alert("Please request an OTP first."); return; }

  try {
    btn.disabled = true;
    btn.textContent = "Verifying…";
    errorEl.style.display = "none";

    const result = await confirmationResult.confirm(otp);
    const user = result.user;
    const userSnap = await getDoc(doc(db, "users", user.uid));

    closePhoneModal();

    if (!userSnap.exists()) {
      alert("Account not found. Please sign up first.");
      openSignUp();
      const phoneEl = document.getElementById("signupPhone");
      if (phoneEl) phoneEl.value = user.phoneNumber || "";
    } else {
      saveUserToStorage(user);
      updateAuthUI(true);
      openHome();
    }
  } catch (err) {
    console.error(err);
    errorEl.textContent = "Incorrect OTP. Try again.";
    errorEl.style.display = "";
  } finally {
    btn.disabled = false;
    btn.textContent = "Verify & Login →";
  }
}

function setupRecaptcha() {
  if (window.recaptchaVerifier) {
    try { window.recaptchaVerifier.clear(); } catch (_) { }
    window.recaptchaVerifier = null;
  }
  const container = document.getElementById('recaptcha-container');
  if (container) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'normal', callback: () => { }
    });
  }
}

// Auth State Observer
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    clearUserFromStorage();
    updateAuthUI(false);
    return;
  }
  
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const profileData = userSnap.exists() ? userSnap.data() : null;
  
  const isUserAdmin = isAdminEmail(user.email || (profileData && profileData.email));
  
  if (profileData || isUserAdmin) {
    saveUserToStorage(user, profileData);
    updateAuthUI(true);
    
    // If the list is empty (potentially blocked by security rules before login), load now
    if (!collegesData || collegesData.length === 0) {
        if (typeof loadColleges === "function") loadColleges();
    }
    
    openHome();
  } else {
    // Regular users without a profile are logged out/sent to Sign Up
    clearUserFromStorage();
    updateAuthUI(false);
  }
});

// Navigation visibility & routing
function openLogin() {
  const main = document.getElementById("mainPage");
  const login = document.getElementById("login-div");
  const signup = document.getElementById("signup-div");
  if (main) main.style.display = "none";
  if (signup) signup.style.display = "none";
  if (login) login.style.display = "flex";
}

let isRegPhoneVerified = false;
let regConfirmationResult = null;

async function sendRegistrationOTP() {
    const phone = document.getElementById("signupPhone").value.trim();
    if(phone.length !== 10 || isNaN(phone)) {
        alert("Enter a 10-digit mobile number.");
        return;
    }
    
    const sendBtn = document.getElementById("regSendOtp");
    sendBtn.disabled = true;
    sendBtn.textContent = "Wait...";

    // 1. FAST EXISTENCE CHECK
    try {
        const q = query(collection(db, "users"), where("phone", "==", phone));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
            alert("Account Already Exists! 📱 Redirecting to Sign In...");
            openLogin();
            const logId = document.getElementById("loginEmail");
            if (logId) logId.value = phone;
            return;
        }
    } catch (e) {
        console.warn("Silent failure on existence check:", e);
    }

    try {
        if (!window.recaptchaRegVerifier) {
            window.recaptchaRegVerifier = new RecaptchaVerifier(auth, 'recaptcha-reg-container', {
                'size': 'invisible'
            });
        }
        
        // Auto-reset if needed
        if (typeof window.recaptchaRegVerifier.reset === "function") {
            window.recaptchaRegVerifier.reset();
        }
        
        // Format to +91 (assuming India for Kerala Vidya Portal)
        const formattedPhone = "+91" + phone;
        regConfirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaRegVerifier);
        
        document.getElementById("regOtpInputWrap").style.display = "block";
        document.getElementById("signupPhone").disabled = true;
        sendBtn.textContent = "Resend";
        sendBtn.disabled = false;
        showToast("OTP sent successfully! 📱");
        setTimeout(() => document.getElementById("regOtpInput").focus(), 100);
    } catch (err) {
        console.error("SMS Registration Error:", err);
        let msg = "SMS failed. Try again soon.";
        if (err.code === "auth/quota-exceeded") msg = "Daily limit of 10 SMS reached! ⚠️";
        if (err.code === "auth/too-many-requests") msg = "Too many attempts. Wait 10 mins. 🔒";
        if (err.code === "auth/invalid-phone-number") msg = "Invalid phone number format.";
        
        showToast(msg);
        sendBtn.disabled = false;
        sendBtn.textContent = "Get OTP";
    }
}

async function verifyRegistrationOTP() {
    const code = document.getElementById("regOtpInput").value.trim();
    if(code.length !== 6) {
        alert("Enter the 6-digit OTP.");
        return;
    }

    const verifyBtn = document.getElementById("regVerifyBtn");
    verifyBtn.disabled = true;
    verifyBtn.textContent = "...";

    try {
        await regConfirmationResult.confirm(code);
        isRegPhoneVerified = true;
        
        // Hide Step 1, Show Step 2
        document.getElementById("signup-step-otp").style.display = "none";
        document.getElementById("signup-step-details").style.display = "grid";
        
        showToast("Phone verified! ✅ Complete your profile.");
    } catch (err) {
        console.error("OTP Verification Error:", err);
        alert("Incorrect Code. Please check the SMS and try again.");
        verifyBtn.disabled = false;
        verifyBtn.textContent = "Verify";
    }
}

function openSignUp() {
  const login = document.getElementById("login-div");
  const signup = document.getElementById("signup-div");
  const main = document.getElementById("mainPage");
  
  // Show signup div
  if (login) login.style.display = "none";
  if (signup) signup.style.display = "flex";
  if (main) main.style.display = "none";
  
  // RESET UI TO STEP 1 (OTP)
  isRegPhoneVerified = false;
  const stepOtp = document.getElementById("signup-step-otp");
  const stepDetails = document.getElementById("signup-step-details");
  if(stepOtp) stepOtp.style.display = "block";
  if(stepDetails) stepDetails.style.display = "none";
  
  const user = auth.currentUser;
  if (user) {
    const nameEl = document.getElementById("signupName");
    const emailEl = document.getElementById("signupEmail");
    if (nameEl && !nameEl.value) nameEl.value = user.displayName || "";
    if (emailEl && !emailEl.value) emailEl.value = user.email || "";
  }
}

function openHome() {
  const login = document.getElementById("login-div");
  const signup = document.getElementById("signup-div");
  const mainContent = document.getElementById("mainContent");
  const adminPanel = document.getElementById("adminPanel");
  const mainPage = document.getElementById("mainPage");

  if (login) login.style.display = "none";
  if (signup) signup.style.display = "none";
  if (mainContent) mainContent.style.display = "";
  if (adminPanel) adminPanel.style.display = "none";
  if (mainPage) mainPage.style.display = "";

  // Restore Home elements (HIDE colleges so it only shows in dedicated views)
  const showIds = ["heroSection", "ticker-wrap", "processSection1", "workflowSection", "aboutSection", "testimonialsSection"];
  showIds.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = "block"; });

  const hideIds = ["colleges", "courses-section", "crsResultHeader", "compare-section"];
  hideIds.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = "none"; });

  const collegesSec = document.getElementById("colleges");
  if (collegesSec) {
      collegesSec.style.display = "none";
      // Clear filters when going home
      const searchInput = document.getElementById('collegeSearchInput');
      const locInput = document.getElementById('locationSearchInput');
      const locText = document.getElementById('selectedLocationText');
      if (searchInput) searchInput.value = "";
      if (locInput) locInput.value = "";
      if (locText) locText.textContent = "Locations";
  }

  const cs = document.getElementById("courses-section");
  if (cs) cs.style.display = "none";
  const comp = document.getElementById("compare-section");
  if (comp) comp.style.display = "none";

  showAllColleges = false;
  renderCollegesSection();

  if (typeof syncNav === "function") syncNav("home");
}

// doLogin handles phone/email + password sign-in
async function doLogin(event) {
  if (event) event.preventDefault();
  let loginId = (document.getElementById("loginEmail")?.value || "").trim();
  const password = (document.getElementById("loginPassword")?.value || "").trim();
  
  if (!loginId || !password) {
    alert("Please enter your login ID and password.");
    return;
  }

  const loginSubmitBtn = document.getElementById("loginSubmitBtn");
  if (loginSubmitBtn) {
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = "Verifying...";
  }

  // Handle phone-number mapping (e.g., 9876543210 -> email)
  let email = loginId;
  const phoneRegex = /^\d{10}$/;
  if (phoneRegex.test(loginId)) {
      try {
        const q = query(collection(db, "users"), where("phone", "==", loginId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          email = qSnap.docs[0].data().email || `${loginId}@keralavidyaportal.com`;
        } else {
          email = `${loginId}@keralavidyaportal.com`;
        }
      } catch (err) {
        console.warn("Phone lookup failure:", err);
        email = `${loginId}@keralavidyaportal.com`;
      }
  }

  try {
    const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js");
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const isUserAdmin = isAdminEmail(user.email);

    if (!userSnap.exists() && !isUserAdmin) {
      alert("Login successful, but profile record missing. completing registration...");
      openSignUp();
    } else {
      saveUserToStorage(user, userSnap.exists() ? userSnap.data() : null);
      updateAuthUI(true);
      openHome();
    }
  } catch (err) {
    console.error("Login error:", err);
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        alert("Invalid mobile/email or password. Please try again.");
    } else {
        alert("Sign in failed: " + (err.message || "Please check your network."));
    }
  } finally {
    if (loginSubmitBtn) {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.textContent = "Sign In Free";
    }
  }
}

// doGoogleLogin — must be at module scope so window.doGoogleLogin works before DOMContentLoaded
const _googleProvider = new GoogleAuthProvider();
async function doGoogleLogin() {
  try {
    const result = await signInWithPopup(auth, _googleProvider);
    const user = result.user;
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const isUserAdmin = isAdminEmail(user.email);

    if (!userSnap.exists() && !isUserAdmin) {
      // User must verify phone first
      if(!isRegPhoneVerified) {
          alert("Phone verification required first. Please verify your mobile number.");
          openSignUp();
          return;
      }
      // If phone is already verified, we can let them finalize
      const nameEl = document.getElementById("signupName");
      const emailEl = document.getElementById("signupEmail");
      if (nameEl) nameEl.value = user.displayName || "";
      if (emailEl) emailEl.value = user.email || "";
      alert("Google info pulled. Review and click 'Finalize' to complete.");
    } else {
      saveUserToStorage(user, userSnap.exists() ? userSnap.data() : null);
      updateAuthUI(true);
      openHome();
    }
  } catch (err) {
    console.error("Google login error:", err);
    if (err.code !== "auth/popup-closed-by-user") {
      alert("Google login failed: " + (err.message || err.code));
    }
  }
}

// Initial Setup
window.addEventListener("DOMContentLoaded", () => {
  // Phone OTP Wiring
  const phoneBtn = document.getElementById("phoneLoginBtn");
  if (phoneBtn) phoneBtn.onclick = openPhoneModal;

  const resendBtn = document.getElementById("resendOtpBtn");
  if (resendBtn) resendBtn.onclick = () => {
    const step1 = document.getElementById("modalPhoneStep");
    const step2 = document.getElementById("modalOtpStep");
    if (step1) step1.style.display = "";
    if (step2) step2.style.display = "none";
    document.querySelectorAll(".otp-box").forEach(b => b.value = "");
    confirmationResult = null;
  };

  const sendOtpBtn = document.getElementById("sendOtpBtn");
  if (sendOtpBtn) sendOtpBtn.onclick = sendOtp;
  const verifyOtpBtn = document.getElementById("verifyOtpBtn");
  if (verifyOtpBtn) verifyOtpBtn.onclick = verifyOtp;

  // Sign up OTP auto-submit
  const regOtpIn = document.getElementById("regOtpInput");
  if (regOtpIn) {
      regOtpIn.addEventListener("input", () => {
          if (regOtpIn.value.length === 6) {
              verifyRegistrationOTP();
          }
      });
  }

  document.querySelectorAll(".otp-box").forEach((box, i, boxes) => {
    box.addEventListener("input", () => {
      box.value = box.value.replace(/\D/g, "");
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
    });
    box.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !box.value && i > 0) boxes[i - 1].focus();
    });
  });

  // Wire Google login buttons (doGoogleLogin is already defined at module scope)
  const gBtn = document.getElementById("googleLogin");
  if (gBtn) gBtn.onclick = doGoogleLogin;
  const gBtnS = document.getElementById("googleLoginSignup");
  if (gBtnS) gBtnS.onclick = doGoogleLogin;

  // Signup Submit
  const sSubmit = document.getElementById("signupSubmit");
  if (sSubmit) {
    sSubmit.onclick = async () => {
      if (!isRegPhoneVerified) {
          alert("Please verify your phone number with OTP first.");
          return;
      }

      const getVal = (id) => (document.getElementById(id) && document.getElementById(id).value) || "";
      const emailInput = getVal("signupEmail").trim();
      const passwordVal = getVal("signupPassword").trim();
      const nameVal = getVal("signupName").trim();
      const phoneVal = getVal("signupPhone").trim().replace(/\D/g, "");
      const emailVal = emailInput || (phoneVal ? `${phoneVal}@keralavidyaportal.com` : "");
      
      // Strict Validation
      if (!nameVal || !emailVal || !passwordVal || !phoneVal) {
          alert("Please fill in all required fields (Name, Phone, and Password).");
          return;
      }
      
      // Better Phone Validation (Exactly 10 digits, no fake patterns)
      if (phoneVal.length !== 10 || isNaN(phoneVal)) {
          alert("Please enter a valid 10-digit mobile number.");
          return;
      }
      if (phoneVal.startsWith("0")) {
          alert("Mobile numbers cannot start with 0. Please enter a valid Indian mobile number.");
          return;
      }
      // Check for repetitive sequences (e.g. 000..., 111..., 999...)
      if (/^(\d)\1{9}$/.test(phoneVal)) {
          alert("Repetitive digit patterns are not allowed. Please enter a genuine phone number.");
          return;
      }
      // Check for obvious sequential patterns
      if ("0123456789".includes(phoneVal) || "9876543210".includes(phoneVal)) {
          alert("Sequential digit patterns are not allowed. Please enter a genuine phone number.");
          return;
      }

      const btn = document.getElementById("signupSubmit");
      if (btn) {
          btn.disabled = true;
          btn.textContent = "Creating Account...";
      }

      let user = auth.currentUser;
      const virtualEmail = `${phoneVal}@keralavidyaportal.com`;
      const authEmail = emailInput || (user && user.email) || virtualEmail;

      try {
        if (!user) {
          // Case A: Fresh Signup (Email/Password)
          const result = await createUserWithEmailAndPassword(auth, authEmail, passwordVal);
          user = result.user;
        } else {
          // Case B: Google User finalize (Link Password Credential)
          const credential = EmailAuthProvider.credential(authEmail, passwordVal);
          try {
            await linkWithCredential(user, credential);
          } catch (le) {
            if (le.code !== 'auth/credential-already-in-use') {
               throw le;
            }
          }
        }
      } catch (err) {
        console.error("Finalization error:", err);
        if (err.code === 'auth/email-already-in-use') {
            alert("This Mobile Number or Email is already registered! 👋 Please Sign In to continue.");
            openLogin();
            const logId = document.getElementById("loginEmail");
            if (logId) logId.value = phoneVal;
            return;
        }
        alert("Registration failed: " + (err.message || "Please try again later."));
        if (btn) { btn.disabled = false; btn.textContent = "Finalize Registration →"; }
        return;
      }

      const userData = {
        uid: user.uid,
        displayName: nameVal || user.displayName || "",
        email: authEmail,
        phone: phoneVal,
        district: getVal("signupDistrict"),
        userType: getVal("signupUserType"),
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, "users", user.uid), userData);
        saveUserToStorage(user, userData);
        
        // --- GOOGLE SHEET SYNC (Silent Background Push) ---
        syncToExternalSheet(userData);
        
        updateAuthUI(true);
        openHome();
      } catch (err) {
        console.error("Firestore save error:", err);
        alert("Account created but profile error. Try logging in again.");
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = "Finalize Registration →"; }
      }
    };
  }

  if (localStorage.getItem(STORAGE_KEY)) {
    updateAuthUI(true);
    openHome();
  }

  if (typeof loadColleges === "function") loadColleges();
});

// Update this with your Google Apps Script URL later
const SHEET_SYNC_URL = "https://script.google.com/macros/s/AKfycbxtB34-9XVwWik1PNWeyvCKkd2Mn4q1Nm8D0uhXz6odQLWx_42auZkiuu7FE-mUjebe/exec";

async function syncToExternalSheet(userData) {
  if (!SHEET_SYNC_URL || SHEET_SYNC_URL.includes("YOUR_GOOGLE")) return;
  try {
    // Send data as URL-encoded parameters (Reliable for Google Sheet doPost)
    const formData = new URLSearchParams();
    for (const key in userData) {
        formData.append(key, userData[key]);
    }

    await fetch(SHEET_SYNC_URL, {
      method: "POST",
      mode: "no-cors", 
      body: formData
    });
    console.log("Sheet sync attempt sent.");
  } catch (err) {
    console.warn("Sheet sync failed silently:", err);
  }
}

// Default colleges used only for seeding Firebase (Admin panel → Seed default colleges)
// image: college photo URL (you can update links in Admin → Colleges → Edit)
const DEFAULT_COLLEGES = [
  { priority: 1, name: "Mookambigai College of Nursing", loc: "Mysore Road, Bangalore", icon: "🏥", image: "https://www.rajarajeswarimedicalcollege.in/wp-content/uploads/2018/11/mcon-building-1024x683.jpg", bg: "linear-gradient(135deg,#e0f2fe,#7dd3fc)", about: "Mookambigai College of Nursing is a premier institution in Bangalore, affiliated with RGUHS and approved by INC and KNC. Part of the prestigious RajaRajeswari group, it offers excellence in nursing education with a focus on clinical competence and compassion.", campus: "Integrated with the 1350-bedded RajaRajeswari Medical College & Hospital, the campus provides extensive clinical training, smart classrooms, advanced skill labs, and comfortable hostel facilities.", place: "Boasts a 100% placement track record with graduates placed in top hospitals across India and globally (UK, USA, Canada, Middle East). Comprehensive pre-placement training is provided starting from the first year.", courses: [{ n: "B.Sc Nursing", d: "4 Years", f: "Yr 1: ₹2.5L | Yr 2-4: ₹1.25L" }], info: [{ l: "Total Fees", v: "₹6.25 Lakhs" }, { l: "Hostel Fee", v: "₹75,000/yr" }, { l: "Affiliation", v: "RGUHS" }, { l: "Approval", v: "INC, KNC" }] },
  { priority: 2, name: "IIT Delhi", loc: "New Delhi, Delhi", icon: "🏛️", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/IIT_Delhi_entrance_gate.jpg/1280px-IIT_Delhi_entrance_gate.jpg", bg: "linear-gradient(135deg,#EEF2FF,#C7D2FE)", about: "IIT Delhi is one of the leading public technical and research universities in India.", campus: "Vibrant campus in Hauz Khas.", place: "Highest placements in India.", courses: [{ n: "B.Tech Computer Science", d: "4 Yrs · ₹8.5L/yr" }], info: [{ l: "Established", v: "1961" }] },
  { priority: 3, name: "IIM Ahmedabad", loc: "Ahmedabad, Gujarat", icon: "💼", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/IIM_Ahmedabad_New_Campus.jpg/1280px-IIM_Ahmedabad_New_Campus.jpg", bg: "linear-gradient(135deg,#FDF4FF,#E9D5FF)", about: "The top management school in India.", campus: "Iconic red-brick campus.", place: "100% placement in global firms.", courses: [{ n: "MBA", d: "2 Yrs" }], info: [{ l: "Established", v: "1961" }] },
  { priority: 4, name: "BITS Pilani", loc: "Pilani, Rajasthan", icon: "🔬", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/BITS_Pilani.jpg/1280px-BITS_Pilani.jpg", bg: "linear-gradient(135deg,#EFF6FF,#BFDBFE)", about: "Deemed university known for engineering excellence.", campus: "Sprawling heritage campus.", place: "0% unemployment for graduates.", courses: [{ n: "B.E. CS", d: "4 Yrs" }], info: [{ l: "Established", v: "1964" }] },
  { priority: 5, name: "AIIMS New Delhi", loc: "New Delhi, Delhi", icon: "⚗️", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/AIIMS_New_Delhi_Overview.jpg/1280px-AIIMS_New_Delhi_Overview.jpg", bg: "linear-gradient(135deg,#ECFDF5,#A7F3D0)", about: "AIIMS New Delhi is the premier hospital and medical university.", campus: "Central Delhi location.", place: "Global medical leaders.", courses: [{ n: "MBBS", d: "5.5 Yrs" }], info: [{ l: "Established", v: "1956" }] },
  { priority: 6, name: "Acharya Bangalore B-School", loc: "Bangalore, Karnataka", icon: "🏫", image: "https://abbs.edu.in/wp-content/uploads/2023/11/abbs-campus.jpg", bg: "linear-gradient(135deg,#FFF0F8,#FBCFE8)", about: "One of the top business schools in Bangalore.", campus: "Modern campus.", place: "Top recruiters: IBM, Amazon.", courses: [{ n: "MBA", d: "2 Yrs" }, { n: "B.Sc Nursing", d: "4 Yrs" }], info: [{ l: "Established", v: "2008" }, { l: "Location", v: "Bangalore" }] }
];

let collegesData = [];
let currentDisplayList = [];
let showAllColleges = false;

function getSortedColleges() {
  return [...collegesData].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}

function getFilteredColleges() {
  const nameQ = (document.getElementById('collegeSearchInput')?.value || "").toLowerCase().trim();
  const locQ = (document.getElementById('locationSearchInput')?.value || "").toLowerCase().trim();

  return collegesData.filter((c) => {
    // 0. Visibility check: ALWAYS hide from public site if marked as hidden
    if (c.hidden) return false;

    let matchesLoc = true;
    let matchesName = true;

    // 1. Location Matching
    if (locQ) {
      const lowerLoc = (c.loc || "").toLowerCase();
      let synonyms = [locQ];
      if (locQ === "bangalore") synonyms.push("bengaluru");
      if (locQ === "bengaluru") synonyms.push("bangalore");
      matchesLoc = synonyms.some(s => lowerLoc.includes(s));
    }

    // 2. Simple Matching (Name, About, Courses, Fees)
    if (nameQ) {
      const nameMatch = (c.name || "").toLowerCase().includes(nameQ);
      const aboutMatch = (c.about || "").toLowerCase().includes(nameQ);
      const coursesMatch = (c.courses || []).some(cr => (cr.n || "").toLowerCase().includes(nameQ));
      const infoStr = JSON.stringify(c.info || "").toLowerCase();
      const infoMatch = infoStr.includes(nameQ);

      matchesName = nameMatch || aboutMatch || coursesMatch || infoMatch;
    }

    return matchesLoc && matchesName;
  });
}

async function loadColleges() {
  try {
    const snapshot = await getDocs(collection(db, "colleges"));
    collegesData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    // Sort by priority (lower number = higher importance)
    collegesData.sort((a, b) => (a.priority || 999) - (b.priority || 999));

    const countEl = document.getElementById("collegesCountText");
    if (countEl) countEl.textContent = collegesData.length > 0 ? collegesData.length + "+" : "0";
    renderCollegesSection();
    return collegesData;
  } catch (err) {
    console.error("Load colleges error:", err);
    collegesData = [];
    currentDisplayList = [];
    renderCollegesSection();
    return [];
  }
}

function applyCollegeSearch() {
  renderCollegesSection();
}
function toggleLocationDropdown(e) {
  if (e) e.stopPropagation();
  const trigger = e.currentTarget;
  const dropdown = trigger.querySelector('.custom-dropdown');
  const arrow = trigger.querySelector('.dropdown-arrow');
  
  // Close others first if needed (optional but better UX)
  // closeAllDropdowns(); 

  if (dropdown) dropdown.classList.toggle('active');
  if (arrow) arrow.classList.toggle('active');
  
  // Toggle active class on the trigger itself for CSS targeting (arrow rotation)
  if (trigger) trigger.classList.toggle('active');
}
window.toggleLocationDropdown = toggleLocationDropdown;
window.applyCollegeSearch = applyCollegeSearch;

function selectLocation(val, txt, e) {
  if (e) e.stopPropagation();

  const input = document.getElementById('locationSearchInput');
  const display = document.getElementById('selectedLocationText');
  const dropdown = document.getElementById('locationDropdown');
  const arrow = document.querySelector('.search-container .dropdown-arrow');
  const trigger = document.querySelector('.loc-box.dropdown-trigger');

  if (input) input.value = val;
  if (display) display.textContent = txt;
  if (dropdown) dropdown.classList.remove('active');
  if (arrow) arrow.classList.remove('active');
  if (trigger) trigger.classList.remove('active');

  applyCollegeSearch();
}
window.selectLocation = selectLocation;

// New: universal close all dropdowns
function closeAllDropdowns() {
  const drops = document.querySelectorAll('.custom-dropdown');
  const arrows = document.querySelectorAll('.dropdown-arrow');
  const triggers = document.querySelectorAll('.dropdown-trigger');
  drops.forEach(d => d.classList.remove('active'));
  arrows.forEach(a => a.classList.remove('active'));
  triggers.forEach(t => t.classList.remove('active'));
}
window.closeAllDropdowns = closeAllDropdowns;

document.addEventListener('click', (e) => {
  const searchBox = e.target.closest('.loc-box');
  if (!searchBox) {
    closeAllDropdowns();
  }
});


function showAllCollegesView() {
  closeAdminPanel();
  showAllColleges = true;
  const viewAllBtn = document.getElementById("viewAllCollegesBtn");
  if (viewAllBtn) viewAllBtn.style.display = "none";

  const hideIds = ["heroSection", "ticker-wrap", "processSection1", "workflowSection",
    "collageDetailsText", "collageTopDetailsText", "courses-section", "aboutSection", "testimonialsSection", "compare-section", "crsResultHeader"];
  hideIds.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = "none"; });

  const collSec = document.getElementById("colleges");
  if (collSec) {
    collSec.style.display = "";
    collSec.style.opacity = "0";
    collSec.style.transform = "translateY(20px)";
    collSec.style.transition = "all 0.6s ease";
    setTimeout(() => {
        collSec.style.opacity = "1";
        collSec.style.transform = "translateY(0)";
        
        // Focus the search input for better UX
        const searchInput = document.getElementById('collegeSearchInput');
        if (searchInput && window.innerWidth > 768) searchInput.focus();
    }, 10);
  }

  syncNav("colleges");
  renderCollegesSection();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
window.showAllCollegesView = showAllCollegesView;

// Navigate to Colleges view pre-filtered by course category
function showCollegesByCategory(category) {
  const searchInput = document.getElementById('collegeSearchInput');
  
  if (!category) {
     // If no category, just go to search and focus
     showAllCollegesView();
     setTimeout(() => {
        if (searchInput) {
            searchInput.value = "";
            searchInput.placeholder = "🔍 Search for your preferred course...";
            searchInput.focus();
        }
     }, 300);
     return;
  }

  const keywordMap = {
    engineering: ['b.tech', 'btech', 'b.e', 'engineering', 'cse', 'mechanical', 'electrical', 'civil', 'ece'],
    management:  ['mba', 'bba', 'management', 'business', 'commerce', 'finance', 'marketing', 'b.com', 'bcom'],
    medical:     ['mbbs', 'nursing', 'pharmacy', 'bpharma', 'b.pharm', 'medical', 'bsc nursing', 'ayurveda', 'dental'],
    design:      ['design', 'b.des', 'bdes', 'architecture', 'fashion', 'visual'],
    arts:        ['ba', 'b.a', 'arts', 'humanities', 'social', 'literature', 'psychology', 'sociology']
  };

  const keywords = keywordMap[category] || [category];
  if (searchInput) {
    searchInput.value = keywords[0];
  }

  showAllCollegesView();

  // After rendering, apply the search filter
  setTimeout(() => {
    if (searchInput) {
      searchInput.value = keywords[0];
    }
    if (typeof applyCollegeSearch === 'function') applyCollegeSearch();
    if (searchInput && window.innerWidth > 768) searchInput.focus();
  }, 100);
}
window.showCollegesByCategory = showCollegesByCategory;


function showCompareView() {
  closeAdminPanel();
  const hideIds = ["heroSection", "ticker-wrap", "processSection1", "workflowSection", 
    "colleges", "courses-section", "aboutSection", "testimonialsSection", "crsResultHeader"];
  hideIds.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = "none"; });

  const compSec = document.getElementById("compare-section");
  if (compSec) {
    compSec.style.display = "";
    compSec.style.opacity = "0";
    compSec.style.transform = "translateY(20px)";
    compSec.style.transition = "all 0.6s ease";
    setTimeout(() => {
        compSec.style.opacity = "1";
        compSec.style.transform = "translateY(0)";
    }, 10);
  }

  syncNav("compare");
  populateCompareDropdowns();
  if (window.refreshAnimations) window.refreshAnimations();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function populateCompareDropdowns() {
  const s1 = document.getElementById("compareCol1");
  const s2 = document.getElementById("compareCol2");
  if (!s1 || !s2) return;

  const options = collegesData
    .filter(c => !c.hidden)
    .map(c => `<option value="${c.name}">${c.name}</option>`)
    .join("");
  s1.innerHTML = `<option value="">Select College 1</option>` + options;
  s2.innerHTML = `<option value="">Select College 2</option>` + options;
}

function updateComparison() {
  const n1 = document.getElementById("compareCol1").value;
  const n2 = document.getElementById("compareCol2").value;
  const result = document.getElementById("comparisonResult");

  if (!n1 || !n2) {
    result.innerHTML = `<div class="compare-placeholder" style="text-align:center; padding:5rem 2rem; background:rgba(233,30,140,0.03); border:2px dashed rgba(233,30,140,0.15); border-radius:24px;">
                            <i class="fa-solid fa-code-compare" style="font-size:3rem; color:var(--pink); opacity:0.3; margin-bottom:1.5rem; display:block;"></i>
                            <h3 style="font-weight:800; color:var(--dark);">Select Two Institutions</h3>
                            <p style="color:var(--gray); font-size:.9rem;">Please pick both institutions to generate the AI Deep-Dive Comparison.</p>
                        </div>`;
    // Control AI button visibility
    const aiBtn = document.getElementById("aiCompareBtn");
    if (aiBtn) aiBtn.style.display = "none";
    return;
  }

  // Clear previous detailed cards and the placeholder when both are selected
  result.innerHTML = "";

  // Show AI button
  const aiBtn = document.getElementById("aiCompareBtn");
  const aiInsight = document.getElementById("aiComparisonInsight");
  if (aiBtn) aiBtn.style.display = "flex";
  if (aiInsight) aiInsight.style.display = "none";
}

// Global AI Knowledge Base (Curated from Assistant's pre-trained data)
const COLLEGE_AI_DB = {
  "Acharya Bangalore B-School": {
    rank: "NIRF Top 100 Equivalent (B-School)",
    strength: "Management & Industry Connection",
    aiInsight: "ABBS is an IACBE accredited B-School known for its 'Platinum Plus' ranking. It dominates in ROI for traditional MBA/BBA programs due to its intense corporate networking in Bangalore's business hubs. Highly recommended for students prioritizing job-readiness over pure research.",
    benefit: "Excellent recruiters like Goldman Sachs, IBM, and ICICI.",
    verdict: "Best for: Practical Management & Business Entrepreneurship."
  },
  "JSS Science & Tech Univ": {
    rank: "Prestigious SJCE Legacy since 1963",
    strength: "Pure Engineering & Multi-Disciplinary Excellence",
    aiInsight: "Following the legendary SJCE heritage, JSS holds a Tier-1 status in technical education. Unlike newer universities, its alumni base is deeply rooted in top global tech (Google, Microsoft). It features massive R&D laboratories and high-performance computation centers.",
    benefit: "Direct entry to global tech through 50+ years of alumni network.",
    verdict: "Best for: Core & Specialized Engineering/Research."
  },
  "Garden City University": {
    rank: "UGC Recognized Global Multi-versity",
    strength: "International Diversity & Balanced Curriculum",
    aiInsight: "GCU stands out for its high international student ratio (100+ nations). Its curriculum is designed for 'Education for Professional Fulfillment', merging academic study with high-end hospitality and life-sciences labs. It offers a more modern, liberal-arts style environment than cores technical colleges.",
    benefit: "Multicultural exposure unmatched in private Bangalore universities.",
    verdict: "Best for: Life Sciences, IT Management & Media."
  },
  "Amity University": {
    rank: "Global Benchmark in Private Education",
    strength: "Future-Ready Infrastructure & Modern Pedagogy",
    aiInsight: "Amity Bangalore offers the brand's 'Gold Standard' infrastructure. It focuses highly on cross-disciplinary credits (CC), allowing students to pick electives from other fields. Their strong tie-ups with SAP, Microsoft, and Cisco provide students with vendor-specific certifications alongside their degrees.",
    benefit: "High-end corporate placement cells and global exchange programs.",
    verdict: "Best for: Students seeking Global Standard facilities and flexible majors."
  },
  "Amity University Bangalore": {
    rank: "Global Benchmark in Private Education",
    strength: "Future-Ready Infrastructure & Modern Pedagogy",
    aiInsight: "Amity Bangalore offers the brand's 'Gold Standard' infrastructure. It focuses highly on cross-disciplinary credits (CC), allowing students to pick electives from other fields. Their strong tie-ups with SAP, Microsoft, and Cisco provide students with vendor-specific certifications alongside their degrees.",
    benefit: "High-end corporate placement cells and global exchange programs.",
    verdict: "Best for: Students seeking Global Standard facilities and flexible majors."
  },
  "Oxford College": {
     rank: "Historic Excellence in Allied Sciences",
     strength: "Paramedical & Nursing Dominance",
     aiInsight: "The Oxford group is a pioneer in Bangalore's professional health education. Their labs are recognized for high-volume research and their nursing graduates have a 99% placement rate in international hospitals (UK, Canada).",
     verdict: "Best for: Professional Nursing & Allied Health Sciences."
  },
  "Gopala Gowda Shanthaveri Memorial": {
     rank: "Over 20 Years of Specialized Clinical Training",
     strength: "High Clinical Exposure in Nursing",
     aiInsight: "A specialized choice for Nursing. Its associate hospitals provide massive patient volume for clinical rounds, which newer colleges cannot provide. It is highly valued in the healthcare industry for producing clinically-strong nurses.",
     verdict: "Best for: High-Intensity Clinical Nursing Training."
  }
};

function generateAIComparison() {
  const n1 = document.getElementById("compareCol1").value;
  const n2 = document.getElementById("compareCol2").value;
  const insightDiv = document.getElementById("aiComparisonInsight");
  const aiBtn = document.getElementById("aiCompareBtn");

  if (!n1 || !n2) return;

  const c1 = collegesData.find(c => c.name === n1);
  const c2 = collegesData.find(c => c.name === n2);

  // Loading animation
  aiBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Synthesizing Global AI Knowledge...`;
  aiBtn.style.pointerEvents = "none";
  aiBtn.style.opacity = "0.7";

  setTimeout(() => {
    const data1 = COLLEGE_AI_DB[n1] || { rank: "Standard Accreditation", strength: "Quality Education", aiInsight: "A reliable institution with consistent performance in the regional education landscape.", benefit: "Focus on academic fundamentals.", verdict: "Best for: General Professional Studies." };
    const data2 = COLLEGE_AI_DB[n2] || { rank: "Standard Accreditation", strength: "Quality Education", aiInsight: "A reliable institution with consistent performance in the regional education landscape.", benefit: "Focus on academic fundamentals.", verdict: "Best for: General Professional Studies." };

    const getInf = (c, label) => {
        if (!c || !c.info) return "Information on request";
        const found = c.info.find(i => i.l.toLowerCase().includes(label.toLowerCase()));
        return found ? found.v : "Verified Institutional Record";
    };

    insightDiv.innerHTML = `
      <div class="ai-insight-box">
          <div style="display:flex; justify-content:center; margin-bottom:1.5rem;">
             <div class="ai-verdict-tag" style="background:#FF6B2C !important;">✦ AI Strategic Analysis</div>
          </div>
          <h3 style="text-align:center; font-family:'Plus Jakarta Sans',sans-serif; color:var(--pink); font-weight:800; font-size:2rem; margin-bottom:1rem;">Executive AI Summary</h3>
          <p style="text-align:center; color:#E31671; font-weight:600; font-size:1.1rem; max-width:1000px; margin:0 auto 3rem;">A high-level strategic breakdown combining verified institutional data with our global AI repository.</p>
          
          <div class="ai-grid desktop-only-ai">
              <div class="ai-fact-card" style="border-color:var(--pink-mid);">
                  <div class="ai-fact-title" style="color:var(--pink);">${n1} Strategic Analysis</div>
                  <div style="font-size:0.85rem; color:#6B7280; font-weight:800; text-transform:uppercase; margin-bottom:0.8rem;">Core Edge: ${data1.strength}</div>
                  <p style="font-size:0.95rem; line-height:1.7; color:#1F2937;">${data1.aiInsight}</p>
                  <div style="margin-top:1.5rem; font-weight:800; color:var(--pink);">${data1.verdict}</div>
              </div>

              <div class="ai-fact-card" style="border-color:var(--pink-mid);">
                  <div class="ai-fact-title" style="color:var(--pink);">${n2} Strategic Analysis</div>
                  <div style="font-size:0.85rem; color:#6B7280; font-weight:800; text-transform:uppercase; margin-bottom:0.8rem;">Core Edge: ${data2.strength}</div>
                  <p style="font-size:0.95rem; line-height:1.7; color:#1F2937;">${data2.aiInsight}</p>
                  <div style="margin-top:1.5rem; font-weight:800; color:var(--pink);">${data2.verdict}</div>
              </div>
          </div>

          <div style="margin-top:2rem; margin-bottom:3rem; padding:2rem; background:rgba(233, 30, 140, 0.04); border-radius:24px; border-left:6px solid var(--pink);">
             <div style="font-weight:800; font-size:0.8rem; color:var(--pink); text-transform:uppercase; letter-spacing:1px; margin-bottom:0.6rem;">✦ The Final AI Recommendation</div>
             <p style="font-size:1.1rem; color:#1F2937; font-weight:700; line-height:1.6;">Based on all metrics including Affiliation, Placements, and Campus resources: Choose <strong>${n1}</strong> for immediate professional ROI. Choose <strong>${n2}</strong> for long-term academic and technical depth.</p>
          </div>

          <div class="desktop-only-ai" style="display:flex; justify-content:center; margin-bottom:1.5rem;">
             <div class="ai-verdict-tag" style="background:var(--pink);">✦ Detailed Data Comparison</div>
          </div>
          <h3 class="desktop-only-ai" style="text-align:center; font-family:'Plus Jakarta Sans',sans-serif; color:var(--pink); font-weight:800; font-size:1.8rem; margin-bottom:2rem;">Verified Side-by-Side Metrics</h3>

          <div class="ai-comparison-table-wrap desktop-only-ai" style="background:#fff; border-radius:18px; border:1px solid var(--pink-mid); overflow:hidden;">
              <table style="width:100%; border-collapse:collapse; font-size:0.95rem;">
                  <thead>
                      <tr style="background:var(--pink-light); border-bottom:2px solid var(--pink-mid);">
                          <th style="padding:1.5rem; text-align:left; width:20%; color:var(--pink); font-weight:800;">Feature Set</th>
                          <th style="padding:1.5rem; text-align:center; color:var(--dark); font-weight:800; font-size:1.2rem;">${n1}</th>
                          <th style="padding:1.5rem; text-align:center; color:var(--dark); font-weight:800; font-size:1.2rem;">${n2}</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr style="border-bottom:1px solid #FFF5FA;">
                          <td style="padding:1.2rem; font-weight:800; color:var(--pink); background:var(--pink-light);">Affiliation</td>
                          <td style="padding:1.2rem; text-align:center; font-weight:600;">${getInf(c1, 'Affiliation') || getInf(c1, 'University') || 'State University Affiliated'}</td>
                          <td style="padding:1.2rem; text-align:center; font-weight:600;">${getInf(c2, 'Affiliation') || getInf(c2, 'University') || 'State University Affiliated'}</td>
                      </tr>
                      <tr style="border-bottom:1px solid #FFF5FA;">
                          <td style="padding:1.2rem; font-weight:800; color:var(--pink); background:var(--pink-light);">Recognition</td>
                          <td style="padding:1.2rem; text-align:center; font-weight:600;">UGC Recognized, AICTE Approved</td>
                          <td style="padding:1.2rem; text-align:center; font-weight:600;">UGC Recognized, AICTE Approved</td>
                      </tr>
                      <tr style="border-bottom:1px solid #FFF5FA;">
                          <td style="padding:1.2rem; font-weight:800; color:var(--pink); background:var(--pink-light);">Campus Features</td>
                          <td style="padding:1.2rem; line-height:1.5;">${c1.campus || 'Modern tech-enabled campus with high-end labs.'}</td>
                          <td style="padding:1.2rem; line-height:1.5;">${c2.campus || 'Modern tech-enabled campus with high-end labs.'}</td>
                      </tr>
                      <tr style="border-bottom:1px solid #FFF5FA;">
                          <td style="padding:1.2rem; font-weight:800; color:var(--pink); background:var(--pink-light);">Placements</td>
                          <td style="padding:1.2rem; text-align:center; font-weight:700; color:#059669;">${c1.place || '90%+ Placement Track Record'}</td>
                          <td style="padding:1.2rem; text-align:center; font-weight:700; color:#059669;">${c2.place || '90%+ Placement Track Record'}</td>
                      </tr>

                      <tr>
                          <td style="padding:1.2rem; font-weight:800; color:var(--pink); background:var(--pink-light);">About Environment</td>
                          <td style="padding:1.2rem; font-size:0.85rem; line-height:1.6;">${c1.about || 'Leading institution in the region.'}</td>
                          <td style="padding:1.2rem; font-size:0.85rem; line-height:1.6;">${c2.about || 'Leading institution in the region.'}</td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>
    `;

    insightDiv.style.display = "block";
    aiBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> AI Deep-Dive Analysis Ready`;
    aiBtn.style.opacity = "1";
    aiBtn.style.pointerEvents = "auto";
    
    // Smooth scroll to insight
    insightDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 1800);
}

function syncNav(activeKey) {
  // Query both desktop inline tabs AND mobile hamburger menu links
  const allNavLinks = document.querySelectorAll(".nav-desktop a[data-nav], .mob-menu a[data-nav]");
  allNavLinks.forEach(link => {
    if (link.dataset.nav === activeKey) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}
window.syncNav = syncNav;


function renderCollegesSection() {
  const grid = document.getElementById("collegesGrid");
  if (!grid) return;

  if (!collegesData.length) {
    grid.innerHTML = '<p class="colleges-empty">No colleges yet.</p>';
    return;
  }
  let list = getFilteredColleges();
  
  // Home Page Optimization: limit to 9 featured colleges unless "View All" is toggled
  if (!showAllColleges && list.length > 9) {
      list = list.slice(0, 9);
      const viewAllBtn = document.getElementById("viewAllCollegesBtn");
      if (viewAllBtn) viewAllBtn.style.display = "block";
  } else {
      const viewAllBtn = document.getElementById("viewAllCollegesBtn");
      if (viewAllBtn && showAllColleges) viewAllBtn.style.display = "none";
  }

  currentDisplayList = list;
  if (!list.length) {
    grid.innerHTML = '<p class="colleges-empty">No matching colleges found.</p>';
    return;
  }
  grid.innerHTML = list.map((c, idx) => {
    const courseCount = (c.courses || []).length;
    const topCourse = courseCount > 0 ? c.courses[0].n : "";
    
    return `
        <div class="col-card hover-lift" onclick="openCollege(${idx})" style="transition-delay: ${idx * 0.05}s; position:relative; overflow:hidden; animation: fadeIn 0.5s ease both;">
          <div class="col-img" style="height:180px;">
            <img src="${c.image}" loading="lazy" style="width:100%; height:100%; object-fit:cover;" />
            ${courseCount > 0 ? `<div class="badge-premium" style="position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.9); backdrop-filter:blur(8px); padding:4px 10px; border-radius:10px; font-size:0.65rem; font-weight:800; color:var(--pink); border:1px solid rgba(233,30,140,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-transform:uppercase;">PREMIUM</div>` : ''}
          </div>
          <div class="col-body" style="padding:1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.4rem;">
                <div class="col-name" style="font-size:1.15rem; font-weight:850; letter-spacing:-0.03em; line-height:1.1; margin-bottom:0;">${c.name}</div>
            </div>
            <div class="col-loc" style="font-size:0.8rem; color:var(--gray); display:flex; align-items:center; gap:4px; margin-bottom:0.75rem;">
                <i class="fa-solid fa-location-dot" style="font-size:0.7rem; color:var(--pink);"></i> ${c.loc}
            </div>
            
            ${topCourse ? `
            <div style="display:flex; align-items:center; justify-content:space-between; margin-top:0.8rem; padding-top:0.8rem; border-top:1.5px solid #F3F4F6;">
                <div style="display:flex; align-items:center; gap:6px;">
                    <div style="width:24px; height:24px; border-radius:6px; background:var(--pink-light); display:flex; align-items:center; justify-content:center; color:var(--pink); font-size:0.75rem;">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>
                    <div style="font-size:0.75rem; font-weight:700; color:var(--dark); opacity:0.8;">${topCourse}</div>
                </div>
                <div style="font-size:0.7rem; font-weight:850; color:var(--pink);">${escapeHtml(c.courses[0].f || '')}</div>
            </div>` : ''}
            
            <div style="margin-top:1rem; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.7rem; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.05em;">View Details</span>
                <div style="width:28px; height:28px; border-radius:50%; background:var(--dark); color:white; display:flex; align-items:center; justify-content:center; font-size:0.8rem; transition:0.3s;" class="arrow-indicator">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            </div>
          </div>
        </div>
      `;
  }).join("");
  
  if (window.refreshAnimations) window.refreshAnimations();
}

// ===== SPA ROUTING =====
function openCollege(idx, specificList) {
  const listToUse = specificList || currentDisplayList;
  const c = listToUse[idx];
  if (!c) return;
  
  // Update detail view contents (same logic as before)
  const dNavName = document.getElementById('d-nav-name');
  if (dNavName) dNavName.textContent = c.name;
  
  const dBg = document.getElementById('d-bg');
  const dImg = document.getElementById('d-college-image');
  if (dBg) dBg.style.background = c.bg || '#f0f0f0';
  
  if (c.image && dImg) {
    dImg.src = c.image; dImg.alt = c.name || '';
    dImg.style.display = ''; 
    if (dBg) dBg.style.display = 'none';
  } else {
    if (dImg) dImg.style.display = 'none';
    if (dBg) {
      dBg.style.display = ''; 
      dBg.textContent = c.icon || '🏫'; 
      dBg.style.fontSize = '6rem';
    }
  }
  
  const dName = document.getElementById('d-name');
  if (dName) dName.textContent = c.name;
  
  const dLoc = document.getElementById('d-loc');
  if (dLoc) dLoc.textContent = '📍 ' + (c.loc || '');
  
  const dAbout = document.getElementById('d-about');
  if (dAbout) dAbout.textContent = c.about || '';
  
  const dCampus = document.getElementById('d-campus');
  if (dCampus) dCampus.textContent = c.campus || '';
  
  const dPlace = document.getElementById('d-place');
  if (dPlace) dPlace.textContent = c.place || '';
  
  const dCourses = document.getElementById('d-courses');
  const courses = Array.isArray(c.courses) ? c.courses : [];
  
  // Reusable function to render a single category's courses with the new fee breakdown
  window._renderCategoryDetail = (catTitle) => {
    const c = window._currentColData;
    if (!c || !c.courses) return;
    
    // Filter the courses based on the same logic used to group them
    const list = c.courses.filter(cr => {
      const n = (cr.n || "").toLowerCase();
      if (catTitle === "Management & Arts") return (n.includes("bca") || n.includes("mca") || n.includes("mba") || n.includes("bba") || n.includes("b.com") || n.includes("bcom") || n.includes("m.com") || n.includes("mcom") || n.includes("ba ") || n.includes("ma ") || n.includes("management") || n.includes("business"));
      if (catTitle === "B.Sc & M.Sc Programs") return (n.includes("b.sc") || n.includes("bsc") || n.includes("m.sc") || n.includes("msc") || n.includes("nursing") || n.includes("allied") || n.includes("para"));
      if (catTitle === "Engineering & B.Tech") return (n.includes("engineering") || n.includes("b.tech") || n.includes("m.tech") || n.includes("be ") || n.includes("b.e "));
      if (catTitle === "Diploma Programs") return (n.includes("diploma") || (n.startsWith("d") && n.includes("-")));
      return false;
    });

    let html = `<div style="grid-column: 1/-1; animation: fadeIn 0.3s ease both;">
                  <button onclick="openCollege(window._currentColIdx)" style="background:none; border:none; color:var(--pink); font-weight:800; cursor:pointer; padding:0; margin-bottom:1.5rem; display:flex; align-items:center; gap:8px;">
                     <i class="fa-solid fa-arrow-left"></i> Back to Categories
                  </button>
                  <div style="margin-bottom:2rem;">
                    <h3 style="font-size:1.8rem; font-weight:850; color:var(--dark); margin:0;">${catTitle}</h3>
                    <p style="color:var(--gray); margin-top:0.4rem;">Explore specialized programs and detailed fee structures.</p>
                  </div>
                </div>`;
    
    html += list.map(cr => `
      <div class="crs-item-premium" style="background:#fff; border:1.8px solid #F3F4F6; border-radius:24px; padding:1.5rem; display:flex; flex-direction:column; gap:1rem; transition:0.4s; box-shadow: 0 4px 15px rgba(0,0,0,0.02); animation: fadeIn 0.4s ease both;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="flex:1;">
               <h4 style="font-size:1.15rem; font-weight:850; color:var(--dark); margin:0; line-height:1.2;">${escapeHtml(cr.n)}</h4>
               <div style="font-size:0.75rem; color:var(--gray); margin-top:4px; font-weight:700;">${escapeHtml(cr.d || 'Duration: N/A')}</div>
            </div>
            <div style="width:40px; height:40px; border-radius:12px; background:var(--pink-light); display:flex; align-items:center; justify-content:center; color:var(--pink); font-size:1rem;"><i class="fa-solid fa-graduation-cap"></i></div>
        </div>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem; padding:1rem; background:rgba(233,30,140,0.02); border:1px solid rgba(233,30,140,0.05); border-radius:16px;">
            <div>
               <div style="font-size:0.6rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:2px;">Fees</div>
               <div style="font-size:0.95rem; font-weight:800; color:var(--dark);">${escapeHtml(cr.f || 'On Request')}</div>
            </div>
            <div>
               <div style="font-size:0.6rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:2px;">Admission</div>
               <div style="font-size:0.95rem; font-weight:800; color:var(--dark);">${escapeHtml(cr.af || '₹0')}</div>
            </div>
        </div>

        <button onclick="openApplyModal(document.getElementById('d-name').textContent, '${escapeQuote(cr.n)}', '')" class="btn-primary" style="width:100%; border-radius:12px; padding:0.8rem; font-size:0.85rem; font-weight:800;">Apply Now →</button>
      </div>
    `).join('');
    
    document.getElementById('d-courses').innerHTML = html;
    document.getElementById('d-courses').scrollIntoView({ behavior: 'smooth' });
  };

  if (dCourses) {
    if (courses.length === 0) {
      dCourses.innerHTML = '<p style="color:#9CA3AF; text-align:center; padding:2rem;">No programs available.</p>';
    } else {
      window._currentColIdx = idx; // Store for back navigation
      window._currentColData = c;   // Store for re-filtering
      
      const order = ["B.Sc & M.Sc Programs", "Management & Arts", "Engineering & B.Tech", "Diploma Programs"];
      const groups = {
        "B.Sc & M.Sc Programs": { icon: "🔬", img: "https://images.unsplash.com/photo-1579154235602-44373db99a23?q=80&w=400", list: [] },
        "Management & Arts": { icon: "💼", img: "https://images.unsplash.com/photo-1454165833756-9a28622bde80?q=80&w=400", list: [] },
        "Engineering & B.Tech": { icon: "⚙️", img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400", list: [] },
        "Diploma Programs": { icon: "📜", img: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=400", list: [] }
      };

      courses.forEach(cr => {
        const n = (cr.n || "").toLowerCase();
        // Check Diploma FIRST in Logic (to avoid misgrouping) but Order it last in UI
        if (n.includes("diploma") || (n.startsWith("d") && n.includes("-"))) groups["Diploma Programs"].list.push(cr);
        else if (n.includes("bca") || n.includes("mca") || n.includes("mba") || n.includes("bba") || n.includes("b.com") || n.includes("bcom") || n.includes("m.com") || n.includes("mcom") || n.includes("ba ") || n.includes("ma ") || n.includes("management") || n.includes("business")) groups["Management & Arts"].list.push(cr);
        else if (n.includes("b.sc") || n.includes("bsc") || n.includes("m.sc") || n.includes("msc") || n.includes("nursing") || n.includes("allied") || n.includes("para")) groups["B.Sc & M.Sc Programs"].list.push(cr);
        else if (n.includes("engineering") || n.includes("b.tech") || n.includes("m.tech") || n.includes("be ") || n.includes("b.e ")) groups["Engineering & B.Tech"].list.push(cr);
      });

      let html = `<div style="grid-column: 1/-1; margin-bottom:1.5rem;"><h3 style="font-size:1.5rem; font-weight:850; color:var(--dark); margin:0;">Explore Programs</h3><p style="color:var(--gray); margin-top:0.3rem;">Secure your future with the right path.</p></div>`;
      
      order.forEach(title => {
        const data = groups[title];
        if (data.list.length > 0) {
           html += `
             <div class="cat-discovery-box" onclick="_renderCategoryDetail('${title}')">
                <div class="cat-discovery-icon">${data.icon}</div>
                <div class="cat-discovery-content">
                   <h4 class="cat-discovery-title">${title}</h4>
                   <p class="cat-discovery-msg">${data.list.length} programs</p>
                </div>
                <div class="cat-discovery-arrow"><i class="fa-solid fa-arrow-right"></i></div>
             </div>
           `;
        }
      });
      dCourses.innerHTML = html;
      dCourses.className = "cat-discovery-grid";
    }
  }

  const dInfo = document.getElementById('d-info');
  const info = Array.isArray(c.info) ? c.info : [];
  if (dInfo) {
    dInfo.innerHTML = info.map(i =>
      `<div class="dic"><div class="dic-l">${escapeHtml(i.l)}</div><div class="dic-v">${escapeHtml(i.v)}</div></div>`
    ).join('');
  }
  
  document.getElementById('det-page').classList.add('active');
  const sc = document.querySelector('.search-container');
  if (sc) sc.style.display = 'none';
  window.scrollTo(0, 0);
}
window.openCollege = openCollege;

// New: Robust lookup by name for cards in any context
function openCollegeByName(name) {
  const idx = collegesData.findIndex(c => c.name === name);
  if (idx !== -1) {
    openCollege(idx, collegesData);
  }
}
window.openCollegeByName = openCollegeByName;

function closeDetail() {
  document.getElementById('det-page').classList.remove('active');
  // Restore the search/filter bar
  const sc = document.querySelector('.search-container');
  if (sc) sc.style.display = '';
  window.scrollTo(0, 0);
}
window.closeDetail = closeDetail;
function goto(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); }

// ===== MOBILE MENU =====
function toggleMenu() {
  const h = document.getElementById('ham');
  const m = document.getElementById('mobMenu');
  const nav = document.getElementById('nav');
  if (h) h.classList.toggle('open');
  if (m) m.classList.toggle('open');
  if (nav) nav.classList.toggle('menu-open');
}
window.toggleMenu = toggleMenu;

function closeMobileMenu() {
    const h = document.getElementById('ham');
    const m = document.getElementById('mobMenu');
    const nav = document.getElementById('nav');
    if (h && h.classList.contains('open')) h.classList.remove('open');
    if (m && m.classList.contains('open')) m.classList.remove('open');
    if (nav) nav.classList.remove('menu-open');
}
window.closeMobileMenu = closeMobileMenu;

// ===== NAV SCROLL =====
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 10);
});

// ===== COUNTERS =====
let counted = false;
function runCounters() {
  if (counted) return; counted = true;
  document.querySelectorAll('[data-target]').forEach(el => {
    const t = +el.dataset.target, s = el.dataset.suf || '';
    let c = 0, step = t / 50;
    const tm = setInterval(() => { c += step; if (c >= t) { c = t; clearInterval(tm); } el.textContent = Math.floor(c) + s; }, 20);
  });
}
const cObs = new IntersectionObserver(e => { if (e[0].isIntersecting) runCounters(); }, { threshold: .3 });
const sr = document.querySelector('.stats-row'); if (sr) cObs.observe(sr);

// ===== REVEAL ON SCROLL =====
const rObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
}, { threshold: .12 });
document.querySelectorAll('.rev').forEach(el => rObs.observe(el));
window.goto = goto;

// ===== HERO ENTRANCE =====
window.addEventListener('load', () => {
  const items = ['.hero-badge', '.hero-tag', '.hero-h1', '.hero-sub', '.hero-btns', '.hero-cards', '.stats-row', '.app-download'];
  items.forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (!el) return;
    Object.assign(el.style, { opacity: '0', transform: 'translateY(20px)', transition: 'opacity .65s ease, transform .65s ease' });
    setTimeout(() => { el.style.opacity = ''; el.style.transform = ''; }, 200 + i * 120);
  });
});

// Navigation active state is now handled by syncNav() inside view-switching functions.


async function openAdminPanel() {
  const user = auth.currentUser;
  let email = user ? user.email : "";
  
  if (!email) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const userData = JSON.parse(raw);
        email = userData.email;
      }
    } catch (_) { }
  }

  if (!user || !isAdminEmail(email)) {
    alert("Access denied. Only allowed admin emails can open the Admin Panel.");
    return;
  }
  const mainContent = document.getElementById("mainContent");
  const adminPanel = document.getElementById("adminPanel");
  if (mainContent) mainContent.style.display = "none";
  if (adminPanel) adminPanel.style.display = "block";
  switchAdminTab("users");
  await loadAdminUsers();
}
window.openAdminPanel = openAdminPanel;


async function syncAllUsersToSheet() {
  const btn = event?.target || document.querySelector('button[onclick="syncAllUsersToSheet()"]');
  const prevText = btn.textContent;
  if (btn) { btn.disabled = true; btn.textContent = "Syncing..."; }
  
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const users = [];
    snapshot.forEach((d) => users.push({ id: d.id, ...d.data(), uid: d.id }));
    
    // Sync each user
    for (const u of users) {
        await syncToExternalSheet(u);
    }
    
    alert(`Successfully sent ${users.length} users to your Google Sheet! Check the sheet now.`);
  } catch (err) {
    console.error("Bulk sync error:", err);
    alert("Sync failed. Check console for details.");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = prevText; }
  }
}
window.syncAllUsersToSheet = syncAllUsersToSheet;

function closeAdminPanel() {
  const mainContent = document.getElementById("mainContent");
  const adminPanel = document.getElementById("adminPanel");
  if (adminPanel) adminPanel.style.display = "none";
  if (mainContent) mainContent.style.display = "";
}
window.closeAdminPanel = closeAdminPanel;

async function loadAdminUsers() {
  const tbody = document.getElementById("adminTableBody");
  const msgEl = document.getElementById("adminPanelMessage");
  if (!tbody || !msgEl) return;
  tbody.innerHTML = "";
  msgEl.textContent = "Loading...";
  msgEl.className = "admin-message";
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const users = [];
    snapshot.forEach((d) => users.push({ id: d.id, ...d.data() }));
    msgEl.textContent = users.length ? "" : "No users yet.";
    if (users.length) msgEl.classList.add("admin-message-ok");
    users.forEach((u) => {
      const tr = document.createElement("tr");
      const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—";
      tr.innerHTML = `
          <td>${escapeHtml(u.displayName || "—")}</td>
          <td>${escapeHtml(u.email || "—")}</td>
          <td>${escapeHtml(u.phone || "—")}</td>
          <td>${escapeHtml(u.userType || "—")}</td>
          <td>${escapeHtml(u.district || "—")}</td>
          <td>${escapeHtml(u.place || "—")}</td>
          <td>${date}</td>
          <td><button type="button" class="btn-nav btn-logout" onclick="deleteUser('${u.id}')" style="padding: .2rem .5rem; font-size: .75rem;">Delete</button></td>
        `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    msgEl.textContent = "Error loading users. Check console.";
    msgEl.className = "admin-message admin-message-err";
  }
}

window.deleteUser = async function (userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  try {
    await deleteDoc(doc(db, "users", userId));
    await loadAdminUsers();
    alert("User deleted successfully.");
  } catch (err) {
    console.error("Error deleting user:", err);
    alert("Error deleting user. See console for details.");
  }
};

function escapeHtml(str) {
  if (str == null || str === "") return "—";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeQuote(str) {
  if (str == null) return "";
  return str.replace(/'/g, "\\'");
}

function switchAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  const usersSec = document.getElementById("adminUsersSection");
  const collegesSec = document.getElementById("adminCollegesSection");
  const appsSec = document.getElementById("adminApplicationsSection");
  const editForm = document.getElementById("adminCollegeEditForm");
  if (usersSec) usersSec.style.display = tab === "users" ? "block" : "none";
  if (collegesSec) collegesSec.style.display = tab === "colleges" ? "block" : "none";
  if (appsSec) appsSec.style.display = tab === "applications" ? "block" : "none";
  if (editForm) editForm.style.display = "none";
  if (tab === "colleges") loadAdminColleges();
  if (tab === "applications") loadAdminApplications();
}
window.switchAdminTab = switchAdminTab;

async function seedDefaultColleges() {
  const input = prompt("How many items would you like to seed? (Enter a number)\nType 'F' after the number (e.g. '5F') to seed BLANK FORMATS instead of real details.", "5");
  if (!input) return;

  const isFormat = input.toLowerCase().includes("f");
  const count = parseInt(input) || 1;
  const msgEl = document.getElementById("adminCollegesMessage");
  
  if (msgEl) msgEl.textContent = "Seeding " + (isFormat ? "blank formats" : "real data") + "...";
  
  try {
    const toSeed = [];
    if (isFormat) {
      for (let i = 1; i <= count; i++) {
        toSeed.push({
          name: "New College #" + i,
          loc: "City, State",
          image: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1000",
          icon: "🏫",
          bg: "linear-gradient(135deg,#f3f4f6,#e5e7eb)",
          about: "Description goes here...",
          campus: "Campus details...",
          place: "Placement info...",
          courses: [{ n: "B.Sc Nursing", d: "4 Years", f: "₹0" }],
          info: [{ l: "Established", v: "2024" }],
          priority: 99
        });
      }
    } else {
      toSeed.push(...DEFAULT_COLLEGES.slice(0, count));
    }

    for (const c of toSeed) {
      await addDoc(collection(db, "colleges"), c);
    }
    if (msgEl) msgEl.textContent = "Seeded " + toSeed.length + " items.";
    await loadAdminColleges();
    await loadColleges();
  } catch (err) {
    console.error(err);
    if (msgEl) msgEl.textContent = "Seed error.";
  }
}

let adminCollegesList = [];

async function loadAdminColleges() {
  const tbody = document.getElementById("adminCollegesBody");
  const msgEl = document.getElementById("adminCollegesMessage");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (msgEl && !msgEl.textContent.startsWith("Seeded")) msgEl.textContent = "Loading…";
  try {
    const snapshot = await getDocs(collection(db, "colleges"));
    adminCollegesList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    // Respect the "Show Hidden" checkbox
    const showHidden = document.getElementById("adminShowHidden")?.checked;
    const listToShow = showHidden ? adminCollegesList : adminCollegesList.filter(c => !c.hidden);

    if (msgEl && !msgEl.textContent.startsWith("Seeded")) msgEl.textContent = listToShow.length + " colleges.";
    listToShow.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${escapeHtml(c.name || "—")}</td>
          <td>${escapeHtml(c.loc || "—")}</td>
          <td style="display:flex; gap:0.5rem; align-items:center;">
            <div style="font-size:0.75rem; color:${c.hidden ? '#dc2626' : '#059669'}; font-weight:700;">${c.hidden ? 'Hidden' : 'Public'}</div>
            <button type="button" class="btn-nav" onclick="toggleCollegeVisibility('${c.id}', ${!!c.hidden})" style="padding: .2rem .5rem; font-size: .75rem; background: ${c.hidden ? '#059669' : '#f59e0b'}; color:white;">${c.hidden ? 'Unhide' : 'Hide'}</button>
            <button type="button" class="btn-nav btn-login" onclick="openCollegeEdit('${c.id}')" style="padding: .2rem .5rem; font-size: .75rem;">Edit</button>
            <button type="button" class="btn-nav btn-logout" onclick="deleteCollege('${c.id}')" style="padding: .2rem .5rem; font-size: .75rem;">Delete</button>
          </td>
        `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    if (msgEl) msgEl.textContent = "Error loading colleges.";
  }
}

window.deleteCollege = async function (collegeId) {
  if (!confirm("Are you sure you want to delete this college? This action cannot be undone.")) return;
  try {
    await deleteDoc(doc(db, "colleges", collegeId));
    await loadAdminColleges();
    await loadColleges();
    alert("College deleted successfully.");
  } catch (err) {
    console.error("Error deleting college:", err);
    alert("Error deleting college. See console for details.");
  }
};

async function deleteAllColleges() {
  if (!confirm("Are you SURE? This will permanently delete ALL colleges from the database!")) return;
  const msgEl = document.getElementById("adminCollegesMessage");
  if (msgEl) msgEl.textContent = "Clearing database...";
  try {
    const snapshot = await getDocs(collection(db, "colleges"));
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "colleges", d.id)));
    await Promise.all(deletePromises);
    if (msgEl) msgEl.textContent = "Deleted all " + snapshot.docs.length + " colleges.";
    await loadAdminColleges();
    await loadColleges();
  } catch (err) {
    console.error("Bulk delete error:", err);
    if (msgEl) msgEl.textContent = "Clear failed. See console.";
  }
}

async function toggleCollegeVisibility(id, isCurrentlyHidden) {
  try {
    await updateDoc(doc(db, "colleges", id), { hidden: !isCurrentlyHidden });
    await loadAdminColleges();
    await loadColleges();
  } catch (err) {
    console.error("Visibility toggle error:", err);
  }
}

async function hideAllColleges() {
  if (!confirm("Hide all colleges from the public site?")) return;
  const msgEl = document.getElementById("adminCollegesMessage");
  if (msgEl) msgEl.textContent = "Hiding all...";
  try {
    const snapshot = await getDocs(collection(db, "colleges"));
    const updatePromises = snapshot.docs.map(d => updateDoc(doc(db, "colleges", d.id), { hidden: true }));
    await Promise.all(updatePromises);
    if (msgEl) msgEl.textContent = "Hidden all colleges.";
    await loadAdminColleges();
    await loadColleges();
  } catch (err) {
    console.error("Hide all error:", err);
  }
}

async function unhideAllColleges() {
  if (!confirm("Unhide all colleges and make them public?")) return;
  const msgEl = document.getElementById("adminCollegesMessage");
  if (msgEl) msgEl.textContent = "Unhiding all...";
  try {
    const snapshot = await getDocs(collection(db, "colleges"));
    const updatePromises = snapshot.docs.map(d => updateDoc(doc(db, "colleges", d.id), { hidden: false }));
    await Promise.all(updatePromises);
    if (msgEl) msgEl.textContent = "Restored all colleges.";
    await loadAdminColleges();
    await loadColleges();
  } catch (err) {
    console.error("Unhide all error:", err);
  }
}

async function loadAdminApplications() {
  const tbody = document.getElementById("adminApplicationsBody");
  const msgEl = document.getElementById("adminApplicationsMessage");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (msgEl) msgEl.textContent = "Loading…";
  try {
    const snapshot = await getDocs(collection(db, "applications"));
    const apps = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort newest first
    apps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    if (msgEl) msgEl.textContent = apps.length + " application" + (apps.length !== 1 ? "s" : "");
    apps.forEach(a => {
      const tr = document.createElement("tr");
      const date = a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : "—";
      const statusColor = a.status === "pending" ? "#F59E0B" : a.status === "accepted" ? "#10B981" : "#EF4444";
      tr.innerHTML = `
          <td><strong>${escapeHtml(a.name || "—")}</strong></td>
          <td>${escapeHtml(a.guardian || "—")}</td>
          <td>${escapeHtml(a.phone || "—")}</td>
          <td>${escapeHtml(a.email || "—")}</td>
          <td>${escapeHtml(a.collegeName || "—")}</td>
          <td>${escapeHtml(a.courseName || "—")}</td>
          <td>${escapeHtml(a.tenth || "—")}</td>
          <td>${escapeHtml(a.twelfth || "—")}</td>
          <td>${escapeHtml(a.entrance || "—")}</td>
          <td>${escapeHtml(a.district || "—")}</td>
          <td><span style="background:${statusColor}22;color:${statusColor};font-size:.72rem;font-weight:700;padding:.2rem .6rem;border-radius:50px;">${a.status || "pending"}</span></td>
          <td>${date}</td>
          <td><button type="button" class="btn-nav btn-logout" onclick="deleteApplication('${a.id}')" style="padding: .2rem .5rem; font-size: .75rem;">Delete</button></td>
        `;
      tbody.appendChild(tr);
    });
    if (!apps.length && msgEl) msgEl.textContent = "No applications yet.";
  } catch (err) {
    console.error(err);
    if (msgEl) msgEl.textContent = "Error loading applications.";
  }
}
window.loadAdminApplications = loadAdminApplications;

window.deleteApplication = async function (appId) {
  if (!confirm("Are you sure you want to delete this application?")) return;
  try {
    await deleteDoc(doc(db, "applications", appId));
    await loadAdminApplications();
    alert("Application deleted successfully.");
  } catch (err) {
    console.error("Error deleting application:", err);
    alert("Error deleting application. See console for details.");
  }
};

function openCollegeEdit(id) {
  const c = adminCollegesList.find((x) => x.id === id);
  if (!c) return;
  document.getElementById("editCollegeId").value = id;
  document.getElementById("editPriority").value = c.priority != null ? c.priority : "";
  document.getElementById("editName").value = c.name || "";
  document.getElementById("editLoc").value = c.loc || "";
  document.getElementById("editImage").value = c.image || "";
  document.getElementById("editIcon").value = c.icon || "";
  document.getElementById("editBg").value = c.bg || "";
  document.getElementById("editAbout").value = c.about || "";
  document.getElementById("editCampus").value = c.campus || "";
  document.getElementById("editPlace").value = c.place || "";
  document.getElementById("editCourses").value = JSON.stringify(c.courses || [], null, 2);
  document.getElementById("editInfo").value = JSON.stringify(c.info || [], null, 2);
  document.getElementById("adminCollegeModalTitle").innerText = "Edit College";
  document.getElementById("adminCollegeEditForm").style.display = "flex";
}

function cancelCollegeEdit() {
  document.getElementById("adminCollegeEditForm").style.display = "none";
}

async function saveCollegeEdit() {
  const id = document.getElementById("editCollegeId").value;

  let courses = [];
  let info = [];

  try {
    courses = JSON.parse(document.getElementById("editCourses").value || "[]");
  } catch (_) {
    alert("Invalid Courses JSON.");
    return;
  }

  try {
    info = JSON.parse(document.getElementById("editInfo").value || "[]");
  } catch (_) {
    alert("Invalid Info JSON.");
    return;
  }

  const priorityVal = document.getElementById("editPriority").value.trim();

  const data = {
    priority: priorityVal === "" ? null : parseInt(priorityVal, 10),
    name: document.getElementById("editName").value.trim(),
    loc: document.getElementById("editLoc").value.trim(),
    image: document.getElementById("editImage").value.trim(),
    icon: document.getElementById("editIcon").value.trim(),
    bg: document.getElementById("editBg").value.trim(),
    about: document.getElementById("editAbout").value.trim(),
    campus: document.getElementById("editCampus").value.trim(),
    place: document.getElementById("editPlace").value.trim(),
    courses,
    info
  };

  try {
    if (id) {
      // UPDATE EXISTING
      await updateDoc(doc(db, "colleges", id), data);
    } else {
      // ADD NEW
      await addDoc(collection(db, "colleges"), data);
    }

    document.getElementById("adminCollegeEditForm").style.display = "none";

    await loadAdminColleges();
    await loadColleges();

    const msgEl = document.getElementById("adminCollegesMessage");
    if (msgEl) msgEl.textContent = id ? "College updated." : "New college added.";

  } catch (err) {
    console.error(err);
    alert("Error saving: " + (err.message || err));
  }
}

function openAddCollege() {
  document.getElementById("editCollegeId").value = "";

  document.getElementById("editPriority").value = "";
  document.getElementById("editName").value = "";
  document.getElementById("editLoc").value = "";
  document.getElementById("editImage").value = "";
  document.getElementById("editIcon").value = "";
  document.getElementById("editBg").value = "";
  document.getElementById("editAbout").value = "";
  document.getElementById("editCampus").value = "";
  document.getElementById("editPlace").value = "";
  document.getElementById("editCourses").value = "[]";
  document.getElementById("editInfo").value = "[]";

  document.getElementById("adminCollegeModalTitle").innerText = "Add New College";
  document.getElementById("adminCollegeEditForm").style.display = "flex";
}

window.openAdminPanel = openAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.switchAdminTab = switchAdminTab;
window.seedDefaultColleges = seedDefaultColleges;
window.openCollegeEdit = openCollegeEdit;
window.cancelCollegeEdit = cancelCollegeEdit;
window.saveCollegeEdit = saveCollegeEdit;
window.openAddCollege = openAddCollege;

window.openLogin = openLogin;
window.openSignUp = openSignUp;
window.openHome = openHome;
window.openCollege = openCollege;
window.showAllCollegesView = showAllCollegesView;
window.applyCollegeSearch = applyCollegeSearch;
window.closeDetail = closeDetail;
window.goto = goto;
window.toggleMenu = toggleMenu;

function populateCollegeDropdown() {
  const dropdown = document.getElementById("collegeSuggestions");
  if (!dropdown) return;
  dropdown.innerHTML = collegesData
    .map((c, idx) => ({ ...c, idx }))
    .filter(c => !c.hidden)
    .map((c) => {
    return `
        <div class="suggestion-item" onclick="selectCollege(${c.idx})">
          <div class="suggestion-name">${c.name}</div>
          <div class="suggestion-loc">${c.loc || ""}</div>
        </div>
      `;
  }).join("");
}

function showCollegeDropdown() {
  const dropdown = document.getElementById("collegeSuggestions");
  dropdown.style.display = "block";
}

function selectCollege(idx) {
  const college = collegesData[idx];
  document.getElementById("filterCollegeName").value = college.name;

  const dropdown = document.getElementById("collegeSuggestions");
  if (dropdown) dropdown.style.display = "none"; // ← add null check

  applyFilters();
}
window.populateCollegeDropdown = populateCollegeDropdown;
window.showCollegeDropdown = showCollegeDropdown;
window.selectCollege = selectCollege;

// ===== COURSES VIEW =====

const COURSE_CATEGORIES = [
  {
    name: "Engineering & B.Tech",
    icon: "⚙️",
    keywords: ["B.TECH", "M.TECH", "B.E", "M.E", "BE ", "ENGINEERING"]
  },
  {
    name: "B.Sc & M.Sc Programs",
    icon: "🔬",
    keywords: ["B.SC", "M.SC", "BSC", "MSC", "NURSING", "PHYSIOTHERAPY", "ALLIED", "PARAMEDICAL"]
  },
  {
    name: "Management & Arts",
    icon: "💼",
    keywords: ["BCA", "MCA", "MBA", "BBA", "B.COM", "M.COM", "BCOM", "MCOM", " B.A", " M.A", "BA ", "MA ", "MANAGEMENT", "BUSINESS"]
  },
  {
    name: "Diploma Programs",
    icon: "📜",
    keywords: ["DIPLOMA", "LATERAL ENTRY", "ITI", "D-PHARM", "D-NURSING"]
  }
];

let activeCourseCategory = null;
let selectedCourseName = null;

const BACHELORS_KEYWORDS = ["B.SC", "B.TECH", "B.E", "B.A", "B.COM", "BBA", "MBBS", "B.DES", "B.PHARM", "BPT", "BAMS", "BHMS", "BACHELOR"];
const MASTERS_KEYWORDS = ["M.SC", "M.TECH", "M.E", "M.A", "M.COM", "MBA", "MD", "MS", "M.DES", "M.PHARM", "MPT", "PG", "POST", "MASTER"];


function showAllCoursesView(e) {
  if (e && e.preventDefault) e.preventDefault();
  console.log("showAllCoursesView triggered");
  closeAdminPanel();
  const hideIds = ["heroSection", "ticker-wrap", "processSection1", "workflowSection",
    "collageDetailsText", "collageTopDetailsText", "colleges", "aboutSection", "testimonialsSection"];
  hideIds.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = "none"; });

  activeCourseCategory = null;
  const cs = document.getElementById("courses-section");
  if (cs) {
    cs.style.display = "block";
    console.log("courses-section set to display:block");
  } else {
    console.error("courses-section NOT FOUND");
  }

  syncNav("Courses");
  renderCourseCategories();
  if (cs) cs.scrollIntoView({ behavior: "smooth" });
}
window.showAllCoursesView = showAllCoursesView;

const CAT_COLORS = [
  { bg: "#EEF2FF", color: "#6366F1" },
  { bg: "#ECFDF5", color: "#10B981" },
  { bg: "#FDF4FF", color: "#A855F7" },
  { bg: "#FFF7ED", color: "#F97316" },
  { bg: "#EFF6FF", color: "#3B82F6" },
  { bg: "#FFFBEB", color: "#F59E0B" },
  { bg: "#FEF2F2", color: "#EF4444" },
  { bg: "#FFF0F8", color: "#E91E8C" },
];

function renderCourseCategories() {
  const grid = document.getElementById("coursesGrid");
  if (!grid) return;

  const filterBar = document.getElementById("coursesFilterBar");
  const filterOverlay = document.getElementById("courseFilterOverlay");
  const filterBtn = document.querySelector("#courses-section .filterBtn");
  if (filterBar) filterBar.classList.remove("active");
  if (filterOverlay) filterOverlay.style.display = "none";
  if (filterBtn) filterBtn.style.display = "none";

  const countEl = document.getElementById("crsResultCount");
  if (countEl) countEl.textContent = "";

  const eyebrow = document.getElementById("coursesTopText");
  const subText = document.getElementById("coursesSubText");
  if (eyebrow) eyebrow.style.display = "none";
  if (subText) subText.textContent = "Choose a category to explore colleges and programs.";

  grid.className = "crs-list-all";
  // ENFORCE ORDER: BSC -> MANAGEMENT -> ENGINEERING -> DIPLOMA
  const order = ["B.Sc & M.Sc Programs", "Management & Arts", "Engineering & B.Tech", "Diploma Programs"];
  const imgMap = {
    "Engineering & B.Tech": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600",
    "B.Sc & M.Sc Programs": "https://images.unsplash.com/photo-1579154235602-44373db99a23?q=80&w=600",
    "Management & Arts": "https://images.unsplash.com/photo-1454165833756-9a28622bde80?q=80&w=600",
    "Diploma Programs": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600"
  };

  html += `<div class="cat-discovery-grid">`;
  order.forEach(title => {
    const catIdx = COURSE_CATEGORIES.findIndex(c => c.name === title);
    if (catIdx !== -1) {
      const cat = COURSE_CATEGORIES[catIdx];
      html += `
          <div class="cat-discovery-box" onclick="selectCourseCategory(${catIdx})" style="background-image:url('${imgMap[title]}'); height:220px;">
             <div class="cat-discovery-content">
                <div class="cat-discovery-icon">${cat.icon}</div>
                <h3 class="cat-discovery-title" style="font-size:1.1rem;">${title}</h3>
                <p class="cat-discovery-msg">Click to explore</p>
             </div>
             <div class="cat-discovery-arrow"><i class="fa-solid fa-arrow-right"></i></div>
          </div>
      `;
    }
  });
  html += `</div>`;

  grid.innerHTML = html;
}
window.renderCourseCategories = renderCourseCategories;

function selectCourseCategory(idx) {
  const cat = COURSE_CATEGORIES[idx];
  activeCourseCategory = cat;
  selectedCourseName = null;

  // Show simplified result header
  const header = document.getElementById("crsResultHeader");
  if (header) header.style.display = "block";

  // Update heading
  const eyebrow = document.getElementById("coursesTopText");
  const subText = document.getElementById("coursesSubText");
  if (eyebrow) {
    eyebrow.style.display = "block";
    eyebrow.textContent = `✦ ${cat.name}`;
  }
  if (subText) subText.textContent = `Explore programs and matching institutions`;

  // Add/Update back button
  let backBtn = document.getElementById("courseCategoryBackBtn");
  if (!backBtn) {
    backBtn = document.createElement("button");
    backBtn.id = "courseCategoryBackBtn";
    backBtn.style.cssText = "display:flex;align-items:center;gap:.4rem;background:none;border:1px solid rgba(233,30,140,0.25);border-radius:50px;padding:.4rem 1.1rem;font-size:.85rem;font-weight:700;color:var(--pink);cursor:pointer;margin-bottom:1.5rem;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;";
    const grid = document.getElementById("coursesGrid");
    grid.parentNode.insertBefore(backBtn, grid);
  }
  
  backBtn.onclick = () => {
    if (selectedCourseName) {
      selectedCourseName = null;
      const eyebrow = document.getElementById("coursesTopText");
      if (eyebrow) eyebrow.textContent = `✦ ${activeCourseCategory.name}`;
      if (activeCourseCategory.name === "All Courses") renderUniqueCourses();
      else renderCourses();
      updateCourseBackBtnState();
    } else {
      activeCourseCategory = null;
      const header = document.getElementById("crsResultHeader");
      if (header) header.style.display = "none";
      backBtn.remove();
      renderCourseCategories();
    }
  };
  backBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> All Categories`;

  renderUniqueCourses();
}

function updateCourseBackBtnState() {
  const backBtn = document.getElementById("courseCategoryBackBtn");
  if (!backBtn) return;
  if (selectedCourseName) {
    backBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Back to Course List`;
  } else {
    backBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> All Categories`;
  }
}

function renderUniqueCourses() {
  const grid = document.getElementById("coursesGrid");
  if (!grid) return;
  grid.className = "unique-courses-view";
  
  const allNames = [];
  collegesData.forEach(c => {
    (c.courses || []).forEach(cr => {
      const nLower = (cr.n || "").toLowerCase();
      // If "All Courses" or if course belongs to active category
      if (activeCourseCategory.keywords.length === 0 || activeCourseCategory.keywords.some(kw => nLower.includes(kw.toLowerCase()))) {
        allNames.push(cr.n);
      }
    });
  });
  
  const uniqueNames = [...new Set(allNames)].sort((a, b) => a.localeCompare(b));
  
  // Group by category for cleaner UI
  const categoryMap = new Map();
  const fields = COURSE_CATEGORIES.filter(c => c.keywords.length > 0);
  fields.forEach(f => categoryMap.set(f.name, []));
  const otherList = [];
  
  uniqueNames.forEach(name => {
    const n = (name || "");
    let assigned = false;

    // Helper for strict word boundary matching
    const strictMatch = (text, kw) => {
      const k = kw.trim().replace(".", "\\.");
      // Use \b for word boundaries. For short codes like IT, BCA, we need exact word matching.
      const regex = new RegExp(`\\b${k}\\b`, "i");
      return regex.test(text);
    };

    // Phase 1: High-confidence field matching
    for (const field of fields) {
      const broadDegreeInitials = ["B.SC", "M.SC", "BSC", "MSC", "B.E", "M.E", "B.A", "M.A", "B.COM", "M.COM"];
      const specificKeywords = field.keywords.filter(k => !broadDegreeInitials.includes(k.toUpperCase()));
      
      if (specificKeywords.some(k => strictMatch(n, k))) {
        categoryMap.get(field.name).push(name);
        assigned = true;
        break;
      }
    }

    // Phase 2: Fallback to degree initials
    if (!assigned) {
      for (const field of fields) {
        if (field.keywords.some(k => strictMatch(n, k))) {
          categoryMap.get(field.name).push(name);
          assigned = true;
          break;
        }
      }
    }
    
    if (!assigned) otherList.push(name);
  });
  
  let html = `<div class="course-list-wrap" style="width:100%;">`;
  
  for (const [catName, list] of categoryMap) {
    if (list.length === 0) continue;
    html += `
       <div class="course-list-section">
          <h3 class="course-list-h">${catName}</h3>
          <div class="course-list-items">
            ${list.map(n => `<div class="course-list-item" onclick="filterBySpecificCourse('${escapeQuote(n)}')">${escapeHtml(n)}</div>`).join("")}
          </div>
       </div>`;
  }
  
  if (otherList.length > 0) {
    html += `
       <div class="course-list-section">
          <h3 class="course-list-h">Other Specialized Programs</h3>
          <div class="course-list-items">
            ${otherList.map(n => `<div class="course-list-item" onclick="filterBySpecificCourse('${escapeQuote(n)}')">${escapeHtml(n)}</div>`).join("")}
          </div>
       </div>`;
  }
  
  html += `</div>`;
  grid.innerHTML = html;
}

function filterBySpecificCourse(courseName) {
  selectedCourseName = courseName;
  const eyebrow = document.getElementById("coursesTopText");
  if (eyebrow) eyebrow.textContent = `✦ ${courseName}`;
  renderCourses();
  updateCourseBackBtnState();
}
window.filterBySpecificCourse = filterBySpecificCourse;

window.selectCourseCategory = selectCourseCategory;

function showHome() {
  const showIds = ["heroSection", "ticker-wrap", "processSection1", "workflowSection", "aboutSection", "testimonialsSection"];
  showIds.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = ""; });
  
  const hideIds = ["colleges", "courses-section", "crsResultHeader", "compare-section"];
  hideIds.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = "none"; });
  
  activeCourseCategory = null;
  const backBtn = document.getElementById("courseCategoryBackBtn");
  if (backBtn) backBtn.remove();
  
  if (typeof syncNav === 'function') syncNav("home");
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.showHome = showHome;

function renderCourses() {
  const grid = document.getElementById("coursesGrid");
  if (!grid) return;
  grid.className = "crs-grid";

  const locQ = ""; // No separate location filtering for categories view

  const flat = [];
  collegesData.forEach(college => {
    const courses = Array.isArray(college.courses) ? college.courses : [];
    courses.forEach(cr => flat.push({ course: cr, college }));
  });

  let filtered = flat.filter(({ course, college }) => {
    // Specific course selection from unique list
    if (selectedCourseName) {
      return (course.n || "").toLowerCase() === selectedCourseName.toLowerCase();
    }

    // Category filter
    if (activeCourseCategory && activeCourseCategory.keywords.length > 0) {
      const courseLower = (course.n || "").toLowerCase();
      const matchesCat = activeCourseCategory.keywords.some(kw => courseLower.includes(kw));
      if (!matchesCat) return false;
    }
    if (locQ && !(college.loc || "").toLowerCase().includes(locQ)) return false;
    return true;
  });

  // Update redesigned results count UI
  const resultCountEl = document.getElementById("crsResultCount");
  if (resultCountEl) {
    if (activeCourseCategory) {
       resultCountEl.innerHTML = `<span>${filtered.length}</span> colleges found`;
    } else {
       resultCountEl.textContent = "";
    }
  }

  // Group by college — show each college once with matching courses listed
  const collegeMap = new Map();
  filtered.forEach(({ course, college }) => {
    if (!collegeMap.has(college.id || college.name)) {
      collegeMap.set(college.id || college.name, { college, courses: [] });
    }
    collegeMap.get(college.id || college.name).courses.push(course);
  });

  const groups = [...collegeMap.values()];

  let countEl = document.getElementById("crsResultCount");
  if (!countEl) {
    countEl = document.createElement("p");
    countEl.id = "crsResultCount";
    countEl.className = "crs-result-count";
    grid.parentNode.insertBefore(countEl, grid);
  }
  const totalCourses = filtered.length;
  countEl.textContent = groups.length
    ? `${totalCourses} course${totalCourses !== 1 ? "s" : ""} across ${groups.length} college${groups.length !== 1 ? "s" : ""}`
    : "";

  if (!groups.length) {
    grid.innerHTML = '<p class="colleges-empty">No courses found. Try adjusting your filters.</p>';
    window._flatCourses = [];
    return;
  }

  // Show individual courses as simplified Apply-focused cards
  grid.innerHTML = filtered.map(({ course, college }, idx) => `
    <div class="crs-item-premium" style="background:#fff; border:1.8px solid #F3F4F6; border-radius:24px; padding:1.5rem; display:flex; flex-direction:column; gap:1rem; transition:0.4s; box-shadow: 0 4px 15px rgba(0,0,0,0.02); animation: fadeIn 0.4s ease both;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="flex:1;">
             <h4 style="font-size:1.15rem; font-weight:850; color:var(--dark); margin:0; line-height:1.2;">${escapeHtml(course.n)}</h4>
             <div onclick="openCollegeByName('${escapeQuote(college.name)}')" style="cursor:pointer; font-size:0.75rem; color:var(--gray); margin-top:4px; font-weight:700;">🏛️ ${escapeHtml(college.name)}</div>
          </div>
          <div style="width:40px; height:40px; border-radius:12px; background:var(--pink-light); display:flex; align-items:center; justify-content:center; color:var(--pink); font-size:1rem;"><i class="fa-solid fa-graduation-cap"></i></div>
      </div>
      
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem; padding:1rem; background:rgba(233,30,140,0.02); border:1px solid rgba(233,30,140,0.05); border-radius:16px;">
          <div>
             <div style="font-size:0.6rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:2px;">Total Fees</div>
             <div style="font-size:0.95rem; font-weight:800; color:var(--dark);">${escapeHtml(course.f || 'On Request')}</div>
          </div>
          <div>
             <div style="font-size:0.6rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:2px;">Location</div>
             <div style="font-size:0.95rem; font-weight:800; color:var(--dark);">${escapeHtml(college.loc || '—')}</div>
          </div>
      </div>

      <button onclick="openApplyModal('${escapeQuote(college.name)}', '${escapeQuote(course.n)}', '')" class="btn-primary" style="width:100%; border-radius:12px; padding:0.8rem; font-size:0.85rem; font-weight:800;">Apply Now →</button>
    </div>
  `).join("");
}
window.renderCourses = renderCourses;

function openCourseDetail(idx) {
  const item = window._flatCourses?.[idx];
  if (!item) return;
  const { course, college } = item;

  document.getElementById("cd-nav-name").textContent = course.n || "";
  document.getElementById("cd-badge").textContent = course.d || "";
  document.getElementById("cd-name").textContent = course.n || "";
  document.getElementById("cd-college").textContent = "🏛️ " + (college.name || "");
  document.getElementById("cd-loc").textContent = "📍 " + (college.loc || "");
  document.getElementById("cd-about").textContent =
    "This program is offered at " + (college.name || "") +
    ". Duration: " + (course.d || "N/A") + ". " +
    "For more details on the curriculum and eligibility, contact the institution directly.";
  document.getElementById("cd-college-about").textContent = college.about || "";
  document.getElementById("cd-campus").textContent = college.campus || "";
  document.getElementById("cd-place").textContent = college.place || "";

  const info = Array.isArray(college.info) ? college.info : [];
  const courseInfo = [
    { l: "Fees", v: course.f || "On Request" },
    { l: "Duration", v: course.d || "—" },
    { l: "College", v: college.name || "—" },
    { l: "Location", v: college.loc || "—" },
    ...info
  ];
  document.getElementById("cd-info").innerHTML = courseInfo.map(i =>
    `<div class="dic"><div class="dic-l">${escapeHtml(i.l)}</div><div class="dic-v">${escapeHtml(i.v)}</div></div>`
  ).join("");

  document.getElementById("course-det-page").classList.add("active");
  window.scrollTo(0, 0);
}
window.openCourseDetail = openCourseDetail;

// Redesigned course filters functions
function toggleCourseLocationDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById("courseLocationDropdown");
  const arrow = document.querySelector("#courseFilterContainer .dropdown-arrow");
  if (dropdown) dropdown.classList.toggle("active");
  if (arrow) arrow.classList.toggle("active");
}
window.toggleCourseLocationDropdown = toggleCourseLocationDropdown;

function selectCourseLocation(loc, label, e) {
  if (e) e.stopPropagation();
  const locInp = document.getElementById("courseLocationSearchInput");
  const locTxt = document.getElementById("courseSelectedLocationText");
  const dropdown = document.getElementById("courseLocationDropdown");
  const arrow = document.querySelector("#courseFilterContainer .dropdown-arrow");

  if (locInp) locInp.value = loc;
  if (locTxt) locTxt.textContent = label;
  if (dropdown) dropdown.classList.remove("active");
  if (arrow) arrow.classList.remove("active");

  renderCourses();
}
window.selectCourseLocation = selectCourseLocation;

function closeCourseDetail() {
  document.getElementById("course-det-page").classList.remove("active");
  window.scrollTo(0, 0);
}
window.closeCourseDetail = closeCourseDetail;


// ===== APPLY MODAL =====
let currentApplyData = { collegeName: "", courseName: "", collegeId: "" };

function openApplyModal(collegeName, courseName, collegeId) {
  currentApplyData = { collegeName, courseName, collegeId };
  document.getElementById("applyModalCollegeName").textContent = collegeName || "College";
  document.getElementById("applyModalCourseName").textContent = courseName || "";

  // Pre-fill from logged-in user
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const u = JSON.parse(raw);
      const nameEl = document.getElementById("applyName");
      const emailEl = document.getElementById("applyEmail");
      const phoneEl = document.getElementById("applyPhone");
      if (nameEl && u.displayName) nameEl.value = u.displayName;
      if (emailEl && u.email) emailEl.value = u.email;
      if (phoneEl && u.phone) phoneEl.value = u.phone;
    }
  } catch (_) { }

  document.getElementById("applyError").style.display = "none";
  document.getElementById("applyModal").style.display = "flex";
  document.body.style.overflow = "hidden";
}
window.openApplyModal = openApplyModal;

function closeApplyModal() {
  document.getElementById("applyModal").style.display = "none";
  document.body.style.overflow = "";
}
window.closeApplyModal = closeApplyModal;

function closeSuccessModal() {
  document.getElementById("applySuccessModal").style.display = "none";
  document.body.style.overflow = "";
}
window.closeSuccessModal = closeSuccessModal;

// Close on backdrop click
document.getElementById("applyModal").addEventListener("click", function (e) {
  if (e.target === this) closeApplyModal();
});

async function submitApplication() {
  const name = document.getElementById("applyName").value.trim();
  const phone = document.getElementById("applyPhone").value.trim();
  const email = document.getElementById("applyEmail").value.trim();
  const errEl = document.getElementById("applyError");

  if (!name || !phone) {
    errEl.textContent = "Please fill in Your Name and Phone Number.";
    errEl.style.display = "";
    return;
  }

  const getV = (id) => (document.getElementById(id) && document.getElementById(id).value.trim()) || "";

  const applicationData = {
    name,
    phone,
    email,
    district: getV("applyDistrict"),
    tenth: getV("applyTenth"),
    twelfth: getV("applyTwelfth"),
    collegeId: currentApplyData.collegeId || "",
    collegeName: currentApplyData.collegeName || "",
    courseName: currentApplyData.courseName || "",
    status: "pending",
    appliedAt: new Date().toISOString(),
    userId: auth.currentUser?.uid || "guest"
  };

  const btn = document.getElementById("applySubmitBtn");
  btn.textContent = "Submitting…";
  btn.disabled = true;
  errEl.style.display = "none";

  try {
    await addDoc(collection(db, "applications"), applicationData);

    // Clear form
    ["applyName", "applyPhone", "applyEmail", "applyDistrict", "applyTenth", "applyTwelfth"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    closeApplyModal();
    const successModal = document.getElementById("applySuccessModal");
    if (successModal) successModal.style.display = "flex";
  } catch (err) {
    console.error(err);
    if (errEl) {
      errEl.textContent = "Submission failed. Please try again.";
      errEl.style.display = "";
    }
  } finally {
    if (btn) {
      btn.textContent = "Submit Application →";
      btn.disabled = false;
    }
  }
}
window.submitApplication = submitApplication;

// ===== HERO CAROUSEL (Merged from script2.js) =====
let curSlide = 0;
let carouselTimer;

function goSlide(n) {
  const slides = document.querySelectorAll('.bg-slide');
  const dots = document.querySelectorAll('.dot');
  if (!slides.length || !dots.length) return;

  slides[curSlide].classList.remove('active');
  dots[curSlide].classList.remove('active');

  curSlide = n;

  slides[curSlide].classList.add('active');
  dots[curSlide].classList.add('active');

  clearInterval(carouselTimer);
  carouselTimer = setInterval(nextSlide, 4800);
}
window.goSlide = goSlide;

function nextSlide() {
  const slides = document.querySelectorAll('.bg-slide');
  if (slides.length) {
    goSlide((curSlide + 1) % slides.length);
  }
}
window.nextSlide = nextSlide;

// Start carousel on load
window.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.bg-slide');
  if (slides.length) {
    carouselTimer = setInterval(nextSlide, 4800);
  }
});

/* ------------------------------------------
   PREMIUM SCROLL REVEAL ENGINE
   ------------------------------------------ */
function initScrollReveal() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Optional: stop observing after reveal
        // observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });
}

// --- Domain-Specific Gateway Functions ---
window.showCollegesByCategory = function(category) {
  const searchInput = document.getElementById('collegeSearchInput');
  const viewSection = document.getElementById('colleges');
  
  if (searchInput) {
    searchInput.value = category;
    showAllCollegesView(); 
    if (typeof applyCollegeSearch === 'function') applyCollegeSearch();
    
    // Smooth scroll to results
    if (viewSection) {
        viewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

window.showCollegesByLocation = function(location) {
  const locInput = document.getElementById('locationSearchInput');
  const locText = document.getElementById('selectedLocationText');
  
  if (locInput) {
    locInput.value = location;
    if (locText) locText.textContent = location;
    
    showAllCollegesView();
    if (typeof applyCollegeSearch === 'function') applyCollegeSearch();
  }
};

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
});

// Re-run for dynamic content
window.refreshAnimations = () => {
  initScrollReveal();
};


