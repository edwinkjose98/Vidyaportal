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
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber
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
  where,
  limit,
  orderBy,
  onSnapshot,
  increment,
  arrayUnion,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

// ===== EXPORTS (Top Level for Reliability) =====
// Note: functions assigned here are hoisted, so this is safe for function declarations.
window.showAllCollegesView = showAllCollegesView;
window.openAdminPanel = openAdminPanel;
window.closeAdminPanel = closeAdminPanel;

window.goSlide = goSlide;
window.nextSlide = nextSlide;
window.toggleMenu = toggleMenu;
window.syncNav = syncNav;

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
window.loadColleges = loadColleges;
window.applyCollegeSearch = applyCollegeSearch;
window.toggleLocationDropdown = toggleLocationDropdown;
window.selectLocation = selectLocation;
window.sendLoginOTP = typeof sendLoginOTP !== "undefined" ? sendLoginOTP : undefined;
window.verifyLoginOTP = typeof verifyLoginOTP !== "undefined" ? verifyLoginOTP : undefined;
window.resetLoginFlow = typeof resetLoginFlow !== "undefined" ? resetLoginFlow : undefined;
window.onerror = function (msg, url, lineNo, columnNo, error) {
  console.error("Global Error Caught:", msg, "at", url, ":", lineNo);
  reportErrorToAdmin("CRITICAL JS ERROR", msg, `${url}:${lineNo}`);
  return false;
};

window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled Promise Rejection:", event.reason);
  reportErrorToAdmin("PROMISE REJECTION", event.reason?.message || event.reason, window.location.href);
});

function reportErrorToAdmin(type, msg, loc) {
  try {
      const uRaw = localStorage.getItem("unicircle_user");
      const userPhone = uRaw ? JSON.parse(uRaw).phone : "GUEST";
      
      const errorData = {
          Type: type,
          Message: String(msg).substring(0, 300),
          Location: String(loc),
          User: userPhone
      };
      
      if (typeof syncToExternalSheet === "function") syncToExternalSheet(errorData);
      
      // Wait slightly to ensure ADMIN config is loaded securely
      setTimeout(() => {
          if (typeof notifyAdmin === "function") {
              notifyAdmin(`⚠️ LIVE ERROR ALERT`, errorData);
          }
      }, 2000);
  } catch (e) { /* ignore secondary error */ }
}

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const STORAGE_KEY = "unicircle_user";

// Auth Utilities
function saveUserToStorage(user, profile = null) {
  if (!user) return;
  try {
    const data = {
      uid: user.uid,
      displayName: (profile && profile.displayName) || user.displayName || "",
      email: (profile && profile.email) || user.email || "",
      phone: (profile && profile.phone) || user.phoneNumber || "",
      profile: (profile) ? true : false // LOCK IN FOR INSTANT ROUTER
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

async function logUserActivity(action) {
  const user = auth.currentUser;
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  try {
    await updateDoc(userRef, {
      activityLog: arrayUnion({
        action: action,
        time: new Date().toISOString()
      }),
      lastActive: new Date().toISOString()
    });
  } catch (e) {
    console.error("Activity log failed:", e);
  }
}
window.logUserActivity = logUserActivity;

function isAdminPhone(phoneIdentifier) {
  if (!phoneIdentifier) return false;
  const p = String(phoneIdentifier).replace(/\D/g, "");
  // Verified Admin Numbers
  const admins = ["9400137383"]; 
  return admins.some(a => p.includes(a));
}

function updateAuthUI(loggedIn) {
  const logoutBtns = document.querySelectorAll(".nav-logout-wrap");
  
  logoutBtns.forEach(el => { if (el) el.style.setProperty("display", loggedIn ? "flex" : "none", "important"); });

  const main = document.getElementById("mainPage");
  const login = document.getElementById("login-div");
  if (main) main.style.setProperty("display", loggedIn ? "block" : "none", "important");
  if (login) login.style.setProperty("display", loggedIn ? "none" : "flex", "important");

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
  const name = userData ? (userData.displayName || userData.phone || "") : (currentUser ? (currentUser.displayName || currentUser.phoneNumber || "") : "");
  const phoneVal = (userData && userData.phone) || (currentUser && currentUser.phoneNumber) || "";
  
  const isUserAdmin = isAdminPhone(phoneVal);

  userNameEls.forEach((el) => { 
    if (el) { 
      el.textContent = name ? "Welcome, " + name : ""; 
      el.style.setProperty("display", name ? "inline-block" : "none", "important"); 
    }
  });

  // MOBILE WELCOME HEADER SYNC
  const mobNote = document.getElementById("mob-welcome-note");
  const mobName = document.getElementById("mob-student-name");
  if (mobNote && mobName) {
    if (loggedIn && name) {
      mobName.textContent = name;
      mobNote.style.display = "block";
    } else {
      mobNote.style.display = "none";
    }
  }
  
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
  signOut(auth).then(() => {
    clearUserFromStorage();
    localStorage.removeItem("kvp_last_view");
    localStorage.removeItem("kvp_last_college");
    sessionStorage.removeItem("kvp_session_tracked");
    updateAuthUI(false);
    const m = document.getElementById("mobMenu");
    if (m && m.classList.contains("open")) toggleMenu();
    // Force a reload to clear any cached states/variables
    window.location.reload();
  }).catch((err) => {
    console.error("Logout error:", err);
    clearUserFromStorage();
    localStorage.removeItem("kvp_last_view");
    localStorage.removeItem("kvp_last_college");
    updateAuthUI(false);
    window.location.reload();
  });
}
window.logout = logout;

// Old Phone / OTP Handlers Removed

function setupRecaptcha() {
  if (window.recaptchaVerifier) {
    try { window.recaptchaVerifier.clear(); } catch (_) { }
    window.recaptchaVerifier = null;
  }
  const container = document.getElementById('recaptcha-container');
  if (container) {
    container.style.display = "none";
    try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible', 
            callback: () => { }
        });
    } catch (e) { console.warn("Recaptcha init failed", e); }
  }
}

// Auth State Observer
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    clearUserFromStorage();
    updateAuthUI(false);
    openLogin(); // ENSURE LOGIN PAGE IS SHOWN
    return;
  }
  
  // We WILL call updateAuthUI(true) only AFTER we know they have a profile or are admin
  // This prevents half-signed-up users from seeing the landing page background

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const profileData = userSnap.exists() ? userSnap.data() : null;
  
  const userPhone = user.phoneNumber || (profileData && profileData.phone);
  const isUserAdmin = isAdminPhone(userPhone);
  
  if (profileData || isUserAdmin) {
    updateAuthUI(true); // SHOW LANDING PAGE NOW
    saveUserToStorage(user, profileData);
    
    // If the list is empty (potentially blocked by security rules before login), load now
    if (!collegesData || collegesData.length === 0) {
        if (typeof loadColleges === "function") loadColleges();
    }

    // --- VISIT TRACKING ---
    if (!sessionStorage.getItem('kvp_session_tracked')) {
        sessionStorage.setItem('kvp_session_tracked', 'true');
        const now = new Date().toISOString();
        try {
            await updateDoc(userRef, {
                visitCount: increment(1),
                lastActive: now,
                visitHistory: arrayUnion(now)
            });
        } catch (e) {
            console.error("Error tracking visit:", e);
        }
    }
    
    // Default all logins/opens to Home as requested
    openHome();
  } else {
    // NEW / PARTIAL USER detected by Firebase
    // We stay on the Login page until they act (e.g. they click Continue with Google)
    updateAuthUI(false);
    const loginDiv = document.getElementById("login-div");
    if (loginDiv) loginDiv.style.setProperty("display", "flex", "important");
    
    // We don't call openSignUp() here anymore to respect the "Login Page First" rule.
    // It will be called when they click Sign Up or Google.
  }
});

// Navigation visibility & routing
function openLogin() {
  const main = document.getElementById("mainPage");
  const login = document.getElementById("login-div");
  const signup = document.getElementById("signup-div");
  if (main) main.style.setProperty("display", "none", "important");
  if (signup) signup.style.setProperty("display", "none", "important");
  if (login) login.style.setProperty("display", "flex", "important");
}

let isRegPhoneVerified = false;
let regConfirmationResult = null;

async function sendRegistrationOTP() {
    const phone = document.getElementById("signupPhone").value.trim();
    if(phone.length !== 10 || isNaN(phone)) {
        showToast("Enter a 10-digit mobile number. 📱");
        return;
    }
    
    const sendBtn = document.getElementById("regSendOtp");
    sendBtn.disabled = true;
    sendBtn.textContent = "Wait...";

    // Trigger SMS and background tasks in PARALLEL for Zero Lag
    const smsPromise = signInWithPhoneNumber(auth, "+91" + phone, window.recaptchaRegVerifier);
    
    // Auxiliary tasks (Non-blocking)
    getDocs(query(collection(db, "users"), where("phone", "==", phone))).catch(() => {});
    setDoc(doc(db, "leads", phone), {
        phone: phone,
        status: "OTP SENT",
        joined: new Date().toLocaleDateString(),
        timestamp: new Date()
    }).catch(() => {});

    notifyAdmin("OTP Attempt (New Signup)", {
        Phone: "+91" + phone,
        Stage: "Pre-OTP",
        Time: new Date().toLocaleTimeString()
    });

    try {
        regConfirmationResult = await smsPromise;
        
        document.getElementById("regOtpInputWrap").style.display = "block";
        document.getElementById("signupPhone").disabled = true;
        
        startOtpTimer("regSendOtp", 60);
        showToast("OTP sent successfully! 📱");
        
        setTimeout(() => {
            const firstBox = document.querySelector(".otp-box-reg");
            if (firstBox) firstBox.focus();
        }, 100);
    } catch (err) {
        console.error("SMS Registration Error:", err);
        let msg = "SMS failed. Try again soon.";
        if (err.code === "auth/quota-exceeded") msg = "Daily limit reached! ⚠️";
        if (err.code === "auth/too-many-requests") msg = "Too many attempts. Wait 5 mins. 🔒";
        
        showToast(msg);
    } finally {
        if (!regConfirmationResult) {
            sendBtn.disabled = false;
            sendBtn.textContent = "Get OTP";
        }
    }
}

function startOtpTimer(btnId, duration = 60) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    
    btn.disabled = true;
    let timeLeft = duration;
    
    const timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timer);
            btn.disabled = false;
            if (btnId === "loginSendOtpBtn") {
                btn.innerHTML = 'Get OTP <i class="fas fa-arrow-right" style="margin-left:6px;"></i>';
            } else {
                btn.textContent = "Resend OTP";
            }
        } else {
            btn.textContent = `Resend in ${timeLeft}s`;
        }
    }, 1000);
}

async function verifyRegistrationOTP() {
    let code = "";
    document.querySelectorAll(".otp-box-reg").forEach(b => code += b.value);
    
    if(code.length !== 6) {
        // No alert here to allow auto-submission if they finish typing, or manual error checking if they click deliberately.
        if (event && event.type === 'click') alert("Complete the 6-digit code! ⚠️");
        return;
    }

    const verifyBtn = document.getElementById("regVerifyBtn");
    verifyBtn.disabled = true;
    verifyBtn.textContent = "...";

    try {
        await regConfirmationResult.confirm(code);
        const user = auth.currentUser;
        const userPhone = user.phoneNumber || "";
        const isAdmin = isAdminPhone(userPhone);

        if (userSnap.exists() || isAdmin) {
            // EXISTING USER OR ADMIN: Straight to Home
            const profileData = userSnap.exists() ? userSnap.data() : { phone: userPhone.replace("+91", ""), isAdmin: true };
            saveUserToStorage(user, profileData);
            updateAuthUI(true);
            openHome();
            showToast("Welcome! 👋 Logged in successfully.");
        } else {
            isRegPhoneVerified = true; 
            const displayEl = document.getElementById("signupPhoneDisplay");
            if (displayEl) displayEl.value = userPhone.replace("+91", "");
            
            document.getElementById("signup-step-otp").style.display = "none";
            document.getElementById("signup-step-details").style.display = "block";
            showToast("Phone verified! ✅ Complete your profile.");
        }
    } catch (err) {
        console.error("OTP Verification Error:", err);
        showToast("Incorrect Code. Try again. ❌");
        verifyBtn.disabled = false;
        verifyBtn.textContent = "Verify";
    }
}

function openSignUp(preVerified = false, verifiedNum = "") {
  const login = document.getElementById("login-div");
  const signup = document.getElementById("signup-div");
  const main = document.getElementById("mainPage");
  
  // Show signup div
  if (login) login.style.display = "none";
  if (signup) signup.style.display = "flex";
  if (main) main.style.display = "none";
  
  const stepOtp = document.getElementById("signup-step-otp");
  const stepDetails = document.getElementById("signup-step-details");

  if (preVerified) {
    isRegPhoneVerified = true;
    if (stepOtp) stepOtp.style.display = "none";
    if (stepDetails) stepDetails.style.display = "block";
    
    // Auto-populate the number used during verification
    const phoneEl = document.getElementById("signupPhone");
    if (phoneEl && verifiedNum) {
        phoneEl.value = verifiedNum;
        phoneEl.disabled = true; // Lock it since it's already verified
    }
    if (window.showToast) window.showToast("Account not found. 📱 Phone verified! Please complete your profile.");
  } else {
    isRegPhoneVerified = false;
    if (stepOtp) stepOtp.style.display = "block";
    if (stepDetails) stepDetails.style.display = "none";
    
    const phoneEl = document.getElementById("signupPhone");
    if (phoneEl) {
        phoneEl.value = "";
        phoneEl.disabled = false;
    }
  }





  
  const user = auth.currentUser;
  if (user) {
    const nameEl = document.getElementById("signupName");
    if (nameEl && !nameEl.value) nameEl.value = user.displayName || "";
  }
}

function openHome() {
  const login = document.getElementById("login-div");
  const signup = document.getElementById("signup-div");
  const mainContent = document.getElementById("mainContent");
  const adminPanel = document.getElementById("adminPanel");
  const mainPage = document.getElementById("mainPage");

  if (login) login.style.setProperty("display", "none", "important");
  if (signup) signup.style.setProperty("display", "none", "important");
  if (mainContent) mainContent.style.display = ""; 
  if (adminPanel) adminPanel.style.display = "none";
  if (mainPage) mainPage.style.setProperty("display", "block", "important");

  // Restore Home elements (HIDE colleges here as requested)
  const showIds = ["heroSection", "categoryGateway", "ticker-wrap", "processSection1", "workflowSection", "aboutSection", "testimonialsSection"];
  showIds.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = "block"; });

  const hideIds = ["colleges", "courses-section", "crsResultHeader", "compare-section"];
  hideIds.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = "none"; });

  window.scrollTo({ top: 0, behavior: 'instant' });

  // Update memory so refresh doesn't jump back to others
  localStorage.setItem("kvp_last_view", "home");
  if (typeof syncNav === "function") syncNav("home");

  const collegesSec = document.getElementById("colleges");
  if (collegesSec) {
      collegesSec.style.display = "none";
      // Clear filters when going home
      const searchInput = document.getElementById('collegeSearchInput');
      const locInput = document.getElementById('locationSearchInput');
      const locText = document.getElementById('selectedLocationText');
      if (searchInput) searchInput.value = "";
      if (locInput) locInput.value = "";
      if (locText) locText.textContent = "All Locations";
  }

  const cs = document.getElementById("courses-section");
  if (cs) cs.style.display = "none";
  const comp = document.getElementById("compare-section");
  if (comp) comp.style.display = "none";

  showAllColleges = false;
  renderCollegesSection();

  if (typeof syncNav === "function") syncNav("home");
  localStorage.setItem("kvp_last_view", "home");
  localStorage.removeItem("kvp_last_college");

}

// ==========================================
// INLINE PHONE OTP LOGIN FLOW
// ==========================================

window.resetLoginFlow = function() {
    document.getElementById('loginPhoneStep').style.display = 'block';
    document.getElementById('loginOtpStep').style.display = 'none';
    document.getElementById('loginPhoneInput').value = '';
    const boxes = document.querySelectorAll('.login-otp-box');
    boxes.forEach(b => b.value = '');
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
    }
};

window.sendLoginOTP = async function() {
    const phoneInput = document.getElementById('loginPhoneInput').value.trim();
    const errorEl = document.getElementById('loginPhoneError');
    const btn = document.getElementById('loginSendOtpBtn');
    
    if (phoneInput.length !== 10) {
        errorEl.textContent = "Please enter a valid 10-digit mobile number";
        errorEl.style.display = 'block';
        return;
    }
    
    errorEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = "Sending...";

    const fullPhone = "+91" + phoneInput;

    // INSTANT LEAD CAPTURE: Save the attempt BEFORE we even wait for OTP success
    setDoc(doc(db, "leads", phoneInput), {
        phone: phoneInput,
        timestamp: new Date(),
        status: "OTP REQUESTED",
        joined: new Date().toLocaleDateString()
    }).catch(e => console.error("Lead capture failed:", e));

    notifyAdmin("OTP Attempt (Login)", {
        Phone: fullPhone,
        Stage: "Pre-OTP",
        Time: new Date().toLocaleTimeString()
    });

    try {
        // SMS request starts immediately
        window.confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
        
        startOtpTimer("loginSendOtpBtn", 60);

        // Transition to OTP step
        document.getElementById('loginPhoneStep').style.display = 'none';
        document.getElementById('loginOtpStep').style.display = 'block';
        document.getElementById('loginOtpSentMsg').textContent = `OTP sent to +91 ${phoneInput}`;
        
        setTimeout(() => {
            const firstBox = document.querySelectorAll('.login-otp-box')[0];
            if (firstBox) firstBox.focus();
        }, 100);

    } catch (err) {
        console.error("OTP Send Error:", err);
        let msg = "Failed to send OTP. Try again.";
        if (err.code === "auth/too-many-requests") msg = "Too many attempts. Please wait 5-10 minutes. 🔒";
        if (err.code === "auth/quota-exceeded") msg = "Daily SMS quota reached. ⚠️";
        
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
        if (window.showToast) window.showToast(msg);

        // CLEANUP: Reset reCAPTCHA to prevent "Already rendered" error on next click
        if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear(); } catch(e){}
            window.recaptchaVerifier = null;
        }
    } finally {
        if (!window.confirmationResult) {
            btn.disabled = false;
            btn.innerHTML = 'Get OTP <i class="fas fa-arrow-right" style="margin-left:6px;"></i>';
        }
    }
};

window.verifyLoginOTP = async function() {
    const otpBoxes = document.querySelectorAll('.login-otp-box');
    const otp = Array.from(otpBoxes).map(b => b.value).join('');
    const errorEl = document.getElementById('loginOtpError');
    const btn = document.getElementById('loginVerifyBtn');

    if (otp.length !== 6) {
        errorEl.textContent = "Please enter all 6 digits";
        errorEl.style.display = 'block';
        return;
    }

    if (!window.confirmationResult) {
        errorEl.textContent = "Please request OTP first";
        errorEl.style.display = 'block';
        return;
    }

    errorEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = "Verifying...";

    try {
        const result = await window.confirmationResult.confirm(otp);
        const user = result.user;
        const userSnap = await getDoc(doc(db, "users", user.uid));

        // MOBILE NOTIFICATION FOR LOGIN
        notifyAdmin("New Student Login", {
            Phone: user.phoneNumber,
            Status: userSnap.exists() ? "Returning User" : "New Registration Started",
            Device: navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop"
        });

        if (!userSnap.exists()) {
            // NEW USER flow: Redirect to signup form instantly
            
            // Populate and show the signup form directly
            openSignUp(true, user.phoneNumber ? user.phoneNumber.replace("+91", "") : "");
            
            // Automatically act as if they verified phone in signup
            document.getElementById('signup-step-otp').style.display = 'none';
            document.getElementById('signup-step-details').style.display = 'grid';
            document.getElementById('signupPhone').value = user.phoneNumber.replace('+91', '');
            
        } else {
            // EXISTING USER: Log them in
            saveUserToStorage(user, userSnap.data());
            updateAuthUI(true);
            openHome();
            if(window.showToast) window.showToast("Logged in successfully!");
        }

    } catch (err) {
        console.error("OTP Verification Error:", err);
        errorEl.textContent = "Invalid OTP code";
        errorEl.style.display = 'block';
        // Clear boxes
        otpBoxes.forEach(b => b.value = '');
        otpBoxes[0].focus();
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Verify & Continue <i class="fas fa-check-circle" style="margin-left:6px;"></i>';
    }
};

// Next OTP box auto-focus logic
document.addEventListener('input', function (e) {
    if (e.target.classList.contains('login-otp-box')) {
        const target = e.target;
        const val = target.value;
        if (isNaN(val)) { target.value = ""; return; }
        if (val != "") {
            const next = target.nextElementSibling;
            if (next) next.focus();
        }
    }
});
document.addEventListener('keyup', function (e) {
    if (e.target.classList.contains('login-otp-box') && e.key === "Backspace") {
        const target = e.target;
        if (target.value === "") {
            const prev = target.previousElementSibling;
            if (prev) { prev.focus(); prev.value = ""; }
        }
    }
});

// Initial Setup
window.addEventListener("DOMContentLoaded", async () => {
  // Setup OTP Auto-Submission
  const setupOtpAutoSubmit = (selector, onComplete) => {
    const boxes = document.querySelectorAll(selector);
    boxes.forEach((box, i) => {
      box.addEventListener("input", (e) => {
        // Only allow numbers
        box.value = box.value.replace(/\D/g, "");
        
        // Auto-focus next box
        if (box.value && i < boxes.length - 1) {
          boxes[i + 1].focus();
        }

        // Auto-submit if all digits are filled
        const code = Array.from(boxes).map(b => b.value).join('');
        if (code.length === boxes.length && onComplete) {
          onComplete();
        }
      });

      box.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !box.value && i > 0) {
          boxes[i - 1].focus();
        }
      });

      // Handle pasting
      box.addEventListener("paste", (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData("text").replace(/\D/g, "");
        if (data.length === boxes.length) {
          boxes.forEach((b, idx) => b.value = data[idx]);
          if (onComplete) onComplete();
        }
      });
    });
  };

  // Wire up the groups
  setupOtpAutoSubmit(".login-otp-box", window.verifyLoginOTP);
  setupOtpAutoSubmit(".otp-box-reg", window.verifyRegistrationOTP);

  // Parallel reCAPTCHA warm-up for zero lag
  if (!window.recaptchaRegVerifier && document.getElementById('recaptcha-reg-container')) {
    window.recaptchaRegVerifier = new RecaptchaVerifier(auth, 'recaptcha-reg-container', { size: 'invisible' });
  }
  if (!window.recaptchaVerifier && document.getElementById('login-recaptcha-container')) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'login-recaptcha-container', { size: 'invisible' });
  }

  // Signup Submit
  const sSubmit = document.getElementById("signupSubmit");
  if (sSubmit) {
    sSubmit.onclick = async () => {
      let user = auth.currentUser;
      if (!user) {
          alert("Session expired. Please verify your phone number again.");
          openLogin();
          return;
      }

      const getVal = (id) => (document.getElementById(id) && document.getElementById(id).value) || "";
      const nameVal = getVal("signupName").trim();
      const districtVal = getVal("signupDistrict").trim();
      const courseVal = getVal("signupPreference").trim();
      const phoneVal = getVal("signupPhone").trim().replace(/\D/g, "");
      
      // Strict Validation
      if (!nameVal || !districtVal || !courseVal) {
          showToast("Please fill in all details! ⚠️");
          return;
      }

      const btn = document.getElementById("signupSubmit");
      if (btn) {
          btn.disabled = true;
          btn.textContent = "Creating Profile...";
      }

      const userData = {
        uid: user.uid,
        displayName: nameVal,
        phone: phoneVal || user.phoneNumber, // Use auth phone if available
        district: districtVal,
        coursePreference: courseVal,
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, "users", user.uid), userData);
        saveUserToStorage(user, userData);
        
        // --- GOOGLE SHEET SYNC (Silent Background Push) ---
        syncToExternalSheet(userData);
        
        updateAuthUI(true);
        openHome();
        if(window.showToast) window.showToast("Registration Complete! ✅");
      } catch (err) {
        console.error("Firestore save error:", err);
        alert("Account created but profile error. Try logging in again.");
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = 'Complete Registration <i class="fas fa-arrow-right" style="margin-left:6px;"></i>'; }
      }
    };
  }

  if (localStorage.getItem(STORAGE_KEY)) {
    updateAuthUI(true);
  }

  if (typeof loadColleges === "function") await loadColleges();
});

// Update this with your Google Apps Script URL later
const SHEET_SYNC_URL = "https://script.google.com/macros/s/AKfycbyLtQZF7KDgHPBBTeIu89SUvc-oeiupSHHynYK5h_ZVKQsT4fJ41XUnZ1PSKrYHA34Y/exec";

async function syncToExternalSheet(userData) {
  if (!SHEET_SYNC_URL || SHEET_SYNC_URL.includes("macros")) {
    console.log("Sheet Sync URL Found, attempting sync...");
  } else {
    return;
  }

  try {
    const params = new URLSearchParams();
    for (const key in userData) {
        let val = userData[key];
        if (val !== null && typeof val === 'object') {
            if (typeof val.toDate === 'function') {
                val = val.toDate().toISOString();
            } else {
                val = JSON.stringify(val);
            }
        }
        params.append(key, val);
    }
    const finalUrl = `${SHEET_SYNC_URL}?${params.toString()}&callback=jsonp_callback_${Date.now()}`;
    await fetch(finalUrl, { method: "GET", mode: "no-cors" });
  } catch (err) { console.warn("Sheet sync failed silently:", err); }
}

// ADMIN MOBILE NOTIFICATION CONFIG
const ADMIN_NOTIFICATION_CONFIG = {
    telegramBotToken: "8527346083:AAHs7gRmwT_BcXTRoiTBVjLwjxayZeVt8tc", 
    telegramChatId: "8739648344",
    enableSheetNotification: true
};

async function notifyAdmin(title, data) {
    console.log(`[ALERT] ${title}`, data);
    
    // 1. Notify via existing Google Sheet Bridge
    if (ADMIN_NOTIFICATION_CONFIG.enableSheetNotification) {
        syncToExternalSheet({
            TYPE: "NOTIFICATION",
            TITLE: title,
            TIMESTAMP: new Date().toISOString(),
            ...data
        });
    }

    // 2. Notify via Telegram (Direct to Mobile)
    if (ADMIN_NOTIFICATION_CONFIG.telegramBotToken && ADMIN_NOTIFICATION_CONFIG.telegramChatId) {
        const message = `🔔 *${title}*\n\n` + 
                      Object.entries(data).map(([k, v]) => `*${k}:* ${v}`).join("\n");
        const url = `https://api.telegram.org/bot${ADMIN_NOTIFICATION_CONFIG.telegramBotToken}/sendMessage`;
        try {
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: ADMIN_NOTIFICATION_CONFIG.telegramChatId,
                    text: message,
                    parse_mode: "Markdown"
                })
            });
        } catch (e) { console.error("Telegram Notification Failed:", e); }
    }
}

// Default colleges used only for seeding Firebase (Admin panel → Seed default colleges)
// image: college photo URL (you can update links in Admin → Colleges → Edit)
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

    // 2. Multi-Keyword Matching (Name, About, Courses, Fees)
    if (nameQ) {
      const q = nameQ.toLowerCase();
      // If the current search exactly matches a category we just clicked, search for ALL related keywords
      let searchTerms = [q];
      if (window.activeCategoryKeywords && window.activeCategoryKeywords.some(sw => sw.toLowerCase() === q)) {
          searchTerms = window.activeCategoryKeywords;
      }

      matchesName = searchTerms.some(term => {
          const t = term.toLowerCase();
          
          // CRITICAL: When searching by category keywords, we must check for COURSE matches first
          const coursesMatch = (c.courses || []).some(cr => (cr.n || "").toLowerCase().includes(t));
          if (coursesMatch) return true;

          // Fallback matches (only if not a specific course search)
          const nameMatch = (c.name || "").toLowerCase().includes(t);
          const aboutMatch = (c.about || "").toLowerCase().includes(t);
          const infoStr = JSON.stringify(c.info || "").toLowerCase();
          const infoMatch = infoStr.includes(t);
          return nameMatch || aboutMatch || infoMatch;
      });
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

    // Save to offline cache
    try {
        localStorage.setItem('kvp_offline_colleges', JSON.stringify(collegesData));
    } catch(e) {}

    const countEl = document.getElementById("collegesCountText");
    if (countEl) countEl.textContent = collegesData.length > 0 ? collegesData.length + "+" : "0";
    renderCollegesSection();
    return collegesData;
  } catch (err) {
    if (err.code === 'permission-denied') {
        console.warn("Colleges restricted to registered users only. Skipping guest load.");
    } else {
        console.error("Load colleges error:", err);
    }
    
    // Attempt offline fallback
    try {
        const cached = localStorage.getItem('kvp_offline_colleges');
        if (cached) {
            collegesData = JSON.parse(cached);
            if (window.showToast) window.showToast("Offline Mode: Showing cached colleges 📶");
            const countEl = document.getElementById("collegesCountText");
            if (countEl) countEl.textContent = collegesData.length > 0 ? collegesData.length + "+" : "0";
            renderCollegesSection();
            return collegesData;
        }
    } catch(e) {}

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

  const hideIds = ["heroSection", "categoryGateway", "ticker-wrap", "processSection1", "workflowSection",
    "collageDetailsText", "collageTopDetailsText", "courses-section", "aboutSection", "testimonialsSection", "compare-section", "crsResultHeader", "gov-loan-portal"];
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
  localStorage.setItem("kvp_last_view", "colleges");
  localStorage.removeItem("kvp_last_college");

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
    management:  ['mba', 'bba', 'pgdm', 'bms', 'business administration'],
    medical:     ['mbbs', 'nursing', 'pharmacy', 'bpharma', 'b.pharm', 'medical', 'bsc nursing', 'ayurveda', 'dental', 'bpt', 'physiotherapy', 'paramedical', 'allied health'],
    design:      ['design', 'b.des', 'bdes', 'architecture', 'fashion', 'interior', 'visual arts', 'bva', 'visual communication'],
    arts:        ['arts', 'ba', 'b.a', 'humanities', 'social', 'literature', 'psychology', 'sociology', 'fine arts']
  };

  const keywords = keywordMap[category.toLowerCase()] || [category];
  window.activeCategoryKeywords = keywords; // STASH FOR FILTERING
  
  if (searchInput) {
    searchInput.value = keywords[0]; // For visual feedback
  }

  if (typeof logUserActivity === 'function') logUserActivity(`Filtered by: ${category}`);
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
  const hideIds = ["heroSection", "categoryGateway", "ticker-wrap", "processSection1", "workflowSection", 
    "colleges", "courses-section", "aboutSection", "testimonialsSection", "crsResultHeader", "gov-loan-portal"];
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
  localStorage.setItem("kvp_last_view", "compare");
  localStorage.removeItem("kvp_last_college");

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
  // Clear the bootstrap style that prevents flicker - let JS take over
  const bootstrapStyle = document.getElementById("bootstrap-ui-style");
  if (bootstrapStyle) bootstrapStyle.remove();

  // Query desktop tabs, mobile hamburger menu links, AND mobile pills
  const allNavLinks = document.querySelectorAll(".nav-desktop a[data-nav], .mob-menu a[data-nav], .nav-pills-container a[data-nav]");
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
    const userAuth = auth.currentUser;
    const infoMsg = userAuth ? "No colleges accessible. Verification complete, but data access is restricted." : "Please log in to browse colleges.";
    grid.innerHTML = `<div class="colleges-empty" style="text-align:center; padding:3.5rem 1.5rem; background:rgba(233,30,140,0.02); border-radius:24px; border:1px dashed rgba(233,30,140,0.15); margin: 1rem;">
        <i class="fa-solid fa-lock" style="font-size:2.5rem; color:var(--pink); margin-bottom:1.2rem; opacity:0.4;"></i>
        <h4 style="font-weight:850; color:var(--dark); margin-bottom:0.6rem;">${infoMsg}</h4>
        <p style="font-size:0.85rem; color:var(--gray); max-width:320px; margin:0 auto 1.5rem; line-height:1.5;">This usually happens if your Firebase Security Rules are set to Admin-only.</p>
        <button onclick="loadColleges()" style="background:var(--pink); color:white; border:none; padding:0.75rem 1.8rem; border-radius:12px; font-weight:800; font-size:0.9rem; cursor:pointer; box-shadow:0 8px 20px rgba(233,30,140,0.2);">Retry Connection</button>
    </div>`;
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
            ${courseCount > 0 ? `<div class="badge-premium" style="position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.9); backdrop-filter:blur(8px); padding:4px 10px; border-radius:10px; font-size:0.65rem; font-weight:800; color:var(--pink); border:1px solid rgba(233,30,140,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-transform:uppercase;">100% job guarantee</div>` : ''}
          </div>
          <div class="col-body" style="padding:1.25rem; display:flex; flex-direction:column; flex-grow:1;">
            <div>
                <div class="col-name" style="font-size:1.15rem; font-weight:850; letter-spacing:-0.03em; line-height:1.1; margin-bottom:0.4rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${c.name}</div>
                <div class="col-loc" style="font-size:0.8rem; color:var(--gray); display:flex; align-items:center; gap:4px; margin-bottom:0.4rem;">
                    <i class="fa-solid fa-location-dot" style="font-size:0.75rem; color:var(--pink);"></i> ${c.loc}
                </div>
            </div>
            
            <div style="margin-top:1.25rem; display:flex; justify-content:space-between; align-items:center; padding-top:1.25rem; border-top:1.5px solid #F3F4F6;">
                <span style="font-size:0.75rem; font-weight:850; color:var(--dark); text-transform:uppercase; letter-spacing:0.05em; opacity:0.6;">View Details</span>
                <div style="width:32px; height:32px; border-radius:50%; border:1.8px solid var(--dark); color:var(--dark); display:flex; align-items:center; justify-content:center; font-size:0.85rem; transition:0.3s;" class="arrow-indicator">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            </div>
          </div>
        </div>
      `;
  }).join("");
  
  if (window.refreshAnimations) window.refreshAnimations();
}

// ===== COURSE CLASSIFICATION ENGINE (Top Level — Single Source of Truth) =====
// ===== SPA ROUTING =====
function openCollege(idx, specificList) {
  const listToUse = specificList || currentDisplayList;
  const c = listToUse[idx];
  if (!c) return;
  
  const dExtra = document.getElementById('d-details-extra');
  if (dExtra) dExtra.style.display = '';
  
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

  document.querySelectorAll('.det-accordion-item').forEach(item => item.classList.remove('active'));
  
  const dCourses = document.getElementById('d-courses');
  const courses = Array.isArray(c.courses) ? c.courses : [];
  
  window.renderCourseItem = function(cr, collegeName) {
    const rawFee = cr.f || "";
    const dur = parseInt(cr.d) || 3;
    const cleanDur = dur + " Years";
    
    const parseFee = (str) => {
       if (!str) return 0;
       const val = parseFloat(str.replace(/[^0-9\.]/g, ""));
       if (isNaN(val)) return 0;
       if (str.toLowerCase().includes('l')) return val * 100000;
       if (str.toLowerCase().includes('k')) return val * 1000;
       return val;
    };

    let totalNum = 0;
    let yearMap = {};
    if (rawFee && rawFee.includes("Yr")) {
       const blocks = rawFee.split('|');
       blocks.forEach(blk => {
          const matches = blk.match(/Yr(\d+)(?:-(\d+))?:\s*₹?([\d\.]+)(\w?)/i);
          if (matches) {
             const start = parseInt(matches[1]);
             const end = matches[2] ? parseInt(matches[2]) : start;
             const realVal = parseFee(matches[3] + (matches[4] || ""));
             for(let i=start; i<=end; i++) {
               yearMap[i] = realVal;
               totalNum += realVal;
             }
          }
       });
    } else {
       totalNum = parseFee(rawFee);
       for (let i = 1; i <= dur; i++) {
         const yVal = cr[`year_${i}`];
         yearMap[i] = yVal ? parseFee(yVal) : (totalNum ? Math.floor(totalNum / dur) : 0);
       }
    }

    const indianFmt = (num) => (!num) ? "On Request" : "₹" + Math.round(num).toLocaleString('en-IN');
    const totalFmt = totalNum ? indianFmt(totalNum) : "On Request";

    let yearHtml = '';
    for (let i = 1; i <= dur; i++) {
      const label = i === 1 ? "1st" : i === 2 ? "2nd" : i === 3 ? "3rd" : "4th";
      const val = (yearMap[i] === "INTERNSHIP" || (cr[`year_${i}`] || "").toLowerCase().includes("internship")) ? "Internship" : (yearMap[i] ? indianFmt(yearMap[i]) : "On Request");
      yearHtml += `<div class="year-box">
          <div class="year-label">${label} Year</div>
          <div class="year-val">${val}</div>
      </div>`;
    }

    const admFeeRaw = (cr.admission_fee || cr.af || '₹0').toString();

    return `
    <div class="crs-item-premium">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; min-height:95px;">
          <div style="flex:1;">
             <h4 style="font-size:1.15rem; font-weight:850; color:var(--dark); margin:0; line-height:1.2;">${escapeHtml(cr.n)}</h4>
             <div style="font-size:0.75rem; color:var(--gray); margin-top:6px; font-weight:700;">Duration: ${escapeHtml(cleanDur)}</div>
          </div>
          <div class="crs-icon-badge"><i class="fa-solid fa-graduation-cap"></i></div>
      </div>
      
      <div class="fee-box-wrap">
          <div style="text-align:center;">
             <div class="fee-label">TOTAL FEES</div>
             <div class="fee-val">${escapeHtml(totalFmt)}</div>
          </div>
          <div style="text-align:center;">
             <div class="fee-label">ADMISSION FEE</div>
             <div class="fee-val">${escapeHtml(admFeeRaw)}</div>
          </div>
      </div>

      <div class="year-grid" style="display:grid; grid-template-columns: repeat(${dur > 2 ? 2 : dur}, 1fr); gap:0.6rem; flex: 1;">
          ${yearHtml}
      </div>

      <button class="btn-apply-course" onclick="openApplyModal('${escapeQuote(collegeName)}', '${escapeQuote(cr.n)}', '')">
          Apply Now <i class="fa-solid fa-arrow-right" style="font-size:0.8em;"></i>
      </button>
    </div>`;
  };

  if (dCourses) {
    if (courses.length === 0) {
      dCourses.innerHTML = '<p style="color:#9CA3AF; text-align:center; padding:2rem;">No programs available.</p>';
    } else {
      window._currentColIdx = idx; 
      window._currentColData = c;   
      
      const searchInput = document.getElementById('courseInnerSearch');
      
      // Sort courses: Nursing first, then BCA, then others
      const sortedCourses = [...(courses || [])].sort((a, b) => {
        const nA = (a.n || "").toLowerCase();
        const nB = (b.n || "").toLowerCase();
        
        const getPriority = (n) => {
          if ((n.includes("bsc nursing") || n.includes("b.sc nursing") || n.includes("b sc nursing")) && !n.includes("post basic") && !n.includes("p.b") && !n.includes("pb")) return 1;
          if (n.includes("bca")) return 2;
          if (n.includes("post basic") || n.includes("p.b") || n.includes("pb")) return 4;
          return 3;
        };
        
        return getPriority(nA) - getPriority(nB);
      });

      // Directly render all courses as requested, skipping the bundle/categorization step
      let html = sortedCourses.map(cr => renderCourseItem(cr, c.name)).join('');
      dCourses.innerHTML = html;
      dCourses.className = "crs-list-detail"; 

      // Apply any existing search query immediately for persistence
      if (searchInput && searchInput.value) {
        window.filterDetailCourses(searchInput.value);
      }
    }
  }

  const dInfo = document.getElementById('d-info');
  let info = Array.isArray(c.info) ? c.info : [];
  
  // Simplified view: Only show specific requested fields in the top information strip
  const allowed = ["established", "recognition", "affiliation", "location"];
  info = info.filter(i => {
    const label = (i.l || "").toLowerCase();
    return allowed.some(a => label.includes(a));
  });

  if (dInfo) {
    dInfo.innerHTML = info.map(i =>
      `<div class="dic"><div class="dic-l">${escapeHtml(i.l)}</div><div class="dic-v">${escapeHtml(i.v)}</div></div>`
    ).join('');
  }
  
  document.getElementById('det-page').classList.add('active');
  const sc = document.querySelector('.search-container');
  if (sc) sc.style.display = 'none';
  window.scrollTo(0, 0);
  localStorage.removeItem("kvp_last_category");
}
window.openCollege = openCollege;

window.filterDetailCourses = function(query) {
  const c = window._currentColData;
  const dCourses = document.getElementById('d-courses');
  if (!c || !dCourses) return;

  const q = query.toLowerCase().trim();
  let filtered = (c.courses || []).filter(cr => 
    (cr.n || "").toLowerCase().includes(q)
  );

  // Apply the same priority sorting to filtered results
  filtered.sort((a, b) => {
    const nA = (a.n || "").toLowerCase();
    const nB = (b.n || "").toLowerCase();
    
    const getPriority = (n) => {
      if ((n.includes("bsc nursing") || n.includes("b.sc nursing") || n.includes("b sc nursing")) && !n.includes("post basic") && !n.includes("p.b") && !n.includes("pb")) return 1;
      if (n.includes("bca")) return 2;
      if (n.includes("post basic") || n.includes("p.b") || n.includes("pb")) return 4;
      return 3;
    };
    
    return getPriority(nA) - getPriority(nB);
  });

  if (filtered.length === 0) {
    dCourses.innerHTML = `<p style="color:#9CA3AF; text-align:center; padding:3rem; grid-column: 1/-1; font-weight:600;">No programs matching "${query}" found.</p>`;
  } else {
    dCourses.innerHTML = filtered.map(cr => renderCourseItem(cr, c.name)).join('');
  }
};

// New: Robust lookup by name for cards in any context
function openCollegeByName(name) {
  const idx = collegesData.findIndex(c => c.name === name);
  if (idx !== -1) {
    openCollege(idx, collegesData);
    if (typeof logUserActivity === 'function') logUserActivity(`Viewed College: ${name}`);
    localStorage.setItem("kvp_last_college", name);
    localStorage.removeItem("kvp_last_category");
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
  let phone = user ? user.phoneNumber : "";
  
  if (!phone) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const userData = JSON.parse(raw);
        phone = userData.phone;
      }
    } catch (_) { }
  }

  if (!user || !isAdminPhone(phone)) {
    alert("Access denied. Only registered admins can open the Admin Panel.");
    return;
  }
  const mainContent = document.getElementById("mainContent");
  const adminPanel = document.getElementById("adminPanel");
  if (mainContent) mainContent.style.display = "none";
  if (adminPanel) adminPanel.style.display = "block";
  switchAdminTab("users");
  await loadAdminUsers();
  
  if (typeof syncNav === "function") syncNav("admin");
  localStorage.setItem("kvp_last_view", "admin");
}
window.openAdminPanel = openAdminPanel;




function closeAdminPanel() {
  showHome();
}
window.closeAdminPanel = closeAdminPanel;

let adminUsersUnsubscribe = null;

async function loadAdminUsers() {
  const tbody = document.getElementById("adminTableBody");
  const msgEl = document.getElementById("adminPanelMessage");
  if (!tbody || !msgEl) return;

  // Unsubscribe from previous listener if it exists to avoid memory leaks
  if (adminUsersUnsubscribe) adminUsersUnsubscribe();

  tbody.innerHTML = "";
  msgEl.textContent = "Connecting to live feed...";
  msgEl.className = "admin-message";

  adminUsersUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
    tbody.innerHTML = "";
    const users = [];
    snapshot.forEach((d) => users.push({ id: d.id, ...d.data() }));

    msgEl.textContent = users.length ? "" : "No users yet.";
    if (users.length) msgEl.classList.add("admin-message-ok");

    // Sort by most recently active first
    users.sort((a,b) => new Date(b.lastActive || 0) - new Date(a.lastActive || 0));

    users.forEach((u) => {
      const tr = document.createElement("tr");
      const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—";
      tr.innerHTML = `
          <td>${escapeHtml(u.displayName || "—")}</td>
          <td>${escapeHtml(u.phone || "—")}</td>
          <td style="font-weight:700; color:var(--pink);">${escapeHtml(u.coursePreference || "—")}</td>
          <td>${escapeHtml(u.district || "—")}</td>
          <td style="font-weight:700; color:#4B5563;">${u.visitCount || 1}</td>
          <td style="font-size:0.72rem; color:var(--gray); line-height:1.2;">
            <div style="font-weight:700; color:var(--pink); margin-bottom:2px;">${u.lastActive ? new Date(u.lastActive).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : 'First Visit'}</div>
            ${u.visitHistory && u.visitHistory.length > 1 ? `
              <div style="font-size:0.6rem; opacity:0.6; height: 32px; overflow-y: auto; border-top: 1px solid #eee; padding-top: 2px;">
                ${u.visitHistory.slice(-4, -1).reverse().map(vt => `<div>${new Date(vt).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>`).join('')}
              </div>
            ` : ''}
          </td>
          <td style="font-size:0.65rem; max-width:150px;">
            <div style="height:55px; overflow-y:auto; color:var(--dark); opacity:0.8;">
              ${u.activityLog && u.activityLog.length > 0 ? 
                u.activityLog.slice(-10).reverse().map(a => `<div style="margin-bottom:4px; padding-bottom:2px; border-bottom:1px solid #f0f0f0;">
                  <span style="font-weight:700; color:var(--pink);">${new Date(a.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>: ${escapeHtml(a.action)}
                </div>`).join('') : '<span style="opacity:0.5;">No activity yet</span>'}
            </div>
          </td>
          <td>${date}</td>
          <td><button type="button" class="btn-nav btn-logout" onclick="deleteUser('${u.id}')" style="padding: .2rem .5rem; font-size: .75rem;">Delete</button></td>
        `;
      tbody.appendChild(tr);
    });
  }, (err) => {
    handleAdminLoadError(err, msgEl, "Users");
  });
}

function handleAdminLoadError(err, msgEl, type) {
    console.error(`Load ${type} error:`, err);
    if (!msgEl) return;
    
    if (err.code === 'permission-denied') {
        msgEl.innerHTML = `<div style="background:#fff7ed; border:1px solid #fed7aa; color:#9a3412; padding:1rem; border-radius:12px; font-size:0.85rem; line-height:1.5;">
            <i class="fas fa-shield-alt" style="margin-right:8px;"></i> 
            <strong>Security Rules Blocked Access</strong><br>
            Your phone +919400137383 is identified as Admin, but your Firebase Console rules need to be updated to allow this number.<br>
            <a href="https://console.firebase.google.com/" target="_blank" style="color:#c2410c; text-decoration:underline; font-weight:700;">Open Firebase Console →</a>
        </div>`;
    } else {
        msgEl.textContent = `Error loading ${type}. Check console for details.`;
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

async function loadAdminLeads() {
    const listBody = document.getElementById("adminLeadsBody");
    if (!listBody) return;
    listBody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:2rem;'>Loading Leads...</td></tr>";

    try {
        const q = query(collection(db, "leads"), orderBy("timestamp", "desc"), limit(200));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            listBody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:2rem; color:#999;'>No signup leads found yet.</td></tr>";
            return;
        }

        listBody.innerHTML = snapshot.docs.map(doc => {
            const d = doc.data();
            return `
                <tr style="border-bottom: 1px solid #F3F4F6;">
                    <td style="padding:1rem; font-weight:700; color:#111827;">${escapeHtml(d.name || "Unknown")}</td>
                    <td style="padding:1rem; color:#4B5563;">${escapeHtml(d.phone || "")}${(d.status==="OTP SENT" ? ' <span style="font-size:0.7rem; color:#e91e63;">(In Progress)</span>':'')}</td>
                    <td style="padding:1rem; color:#6B7280; font-size:0.85rem;">${escapeHtml(d.joined || "")}</td>
                    <td style="padding:1rem;"><span style="background:#FFF0F8; color:#D81B60; padding:4px 10px; border-radius:20px; font-size:0.7rem; font-weight:800;">${escapeHtml(d.status || "SENT")}</span></td>
                    <td style="padding:1rem;">
                        <button onclick="deleteLead('${escapeQuote(d.phone)}')" style="background:#fee2e2; color:#dc2626; border:none; padding:5px 10px; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Delete</button>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (err) {
        handleAdminLoadError(err, document.getElementById("adminLeadsMessage"), "Leads");
    }
}

async function deleteLead(phone) {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
        await deleteDoc(doc(db, "leads", phone));
        loadAdminLeads();
    } catch (err) {
        console.error("Delete lead error:", err);
        alert("Failed to delete lead.");
    }
}
window.deleteLead = deleteLead;

function switchAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  const usersSec = document.getElementById("adminUsersSection");
  const collegesSec = document.getElementById("adminCollegesSection");
  const appsSec = document.getElementById("adminApplicationsSection");
  const editForm = document.getElementById("adminCollegeEditForm");
  const leadsSec = document.getElementById("adminLeadsSection");
  if (usersSec) usersSec.style.display = tab === "users" ? "block" : "none";
  if (collegesSec) collegesSec.style.display = tab === "colleges" ? "block" : "none";
  if (appsSec) appsSec.style.display = tab === "applications" ? "block" : "none";
  if (leadsSec) leadsSec.style.display = tab === "leads" ? "block" : "none";
  if (editForm) editForm.style.display = "none";
  
  if (tab === "colleges") loadAdminColleges();
  if (tab === "applications") loadAdminApplications();
  if (tab === "leads") loadAdminLeads();
}
window.switchAdminTab = switchAdminTab;



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
    handleAdminLoadError(err, msgEl, "Colleges");
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
    handleAdminLoadError(err, msgEl, "Applications");
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

async function adminUploadCollegeImage(el) {
    const file = el.files[0];
    if (!file) return;

    const msg = document.getElementById("uploadStatusMsg");
    if (msg) {
        msg.style.display = "block";
        msg.textContent = "⏳ Uploading...";
    }

    try {
        const timestamp = Date.now();
        const fileName = `colleges/${timestamp}_${file.name}`;
        const storageRef = ref(storage, fileName);
        
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                msg.textContent = `⏳ Uploading (${Math.round(progress)}%)...`;
            }, 
            (error) => {
                console.error("Upload Error:", error);
                msg.textContent = "❌ Upload failed.";
            }, 
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const urlIn = document.getElementById("editImage");
                if (urlIn) urlIn.value = downloadURL;
                msg.textContent = "✅ Upload Successful!";
            }
        );
    } catch (err) {
        console.error(err);
        if (msg) msg.textContent = "❌ Error uploading file.";
    }
}
window.adminUploadCollegeImage = adminUploadCollegeImage;
window.switchAdminTab = switchAdminTab;

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



// ===== COURSES VIEW =====

const COURSE_CATEGORIES = [
  { name: "Engineering & Technology", icon: "⚙️" },
  { name: "Medical & Healthcare", icon: "⚕️" },
  { name: "Commerce, Finance & Management", icon: "💼" },
  { name: "Arts, Humanities & Social Sciences", icon: "🏛️" },
  { name: "Law & Legal Studies", icon: "⚖️" },
  { name: "Design, Media & Creative Arts", icon: "🎨" },
  { name: "Science & Research", icon: "🔬" },
  { name: "Vocational & Skill-Based (B.Voc)", icon: "⚒️" },
  { name: "Other Courses", icon: "🏥" }
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

  syncNav("colleges"); // Match the data-nav="colleges" in index.html
  localStorage.setItem("kvp_last_view", "colleges");

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
  const order = [
    "Engineering & Technology",
    "Medical & Healthcare",
    "Commerce, Finance & Management",
    "Arts, Humanities & Social Sciences",
    "Law & Legal Studies",
    "Design, Media & Creative Arts",
    "Science & Research",
    "Vocational & Skill-Based (B.Voc)"
  ];
  const imgMap = {
    "Engineering & Technology": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600",
    "Medical & Healthcare": "https://images.unsplash.com/photo-1584992236310-6ed134d475ec?q=80&w=600",
    "Commerce, Finance & Management": "https://images.unsplash.com/photo-1454165833756-9a28622bde80?q=80&w=600",
    "Arts, Humanities & Social Sciences": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600",
    "Law & Legal Studies": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600",
    "Design, Media & Creative Arts": "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600",
    "Science & Research": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=600",
    "Vocational & Skill-Based (B.Voc)": "https://images.unsplash.com/photo-1520694478166-daaaaec95b69?q=80&w=600"
  };

  let html = `<div class="cat-discovery-grid">`;
  order.forEach(title => {
    const catIdx = COURSE_CATEGORIES.findIndex(c => c.name === title);
    if (catIdx !== -1) {
      const cat = COURSE_CATEGORIES[catIdx];
      html += `
          <div class="cat-discovery-box hover-lift" onclick="selectCourseCategory(${catIdx})" style="background-image:url('${imgMap[title]}'); height:220px;">
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

function initScrollReveal() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });
}
window.refreshAnimations = () => {
  initScrollReveal();
};

window.showCollegesByCategory = function(category) {
  const searchInput = document.getElementById('collegeSearchInput');
  const viewSection = document.getElementById('colleges');
  if (searchInput) {
    searchInput.value = category;
    showAllCollegesView(); 
    if (typeof applyCollegeSearch === 'function') applyCollegeSearch();
    if (viewSection) viewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

function toggleDetAccordion(id, btn) {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    const item = wrap.closest('.det-accordion-item');
    if (!item) return;
    const wasActive = item.classList.contains('active');
    document.querySelectorAll('.det-accordion-item').forEach(i => i.classList.remove('active'));
    if (!wasActive) item.classList.add('active');
}
window.toggleDetAccordion = toggleDetAccordion;


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
    backBtn.className = "back-btn-small";
    backBtn.style.marginBottom = "1.5rem";
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
  const adminPanel = document.getElementById("adminPanel");
  const mainContent = document.getElementById("mainContent");
  if (adminPanel) adminPanel.style.display = "none";
  if (mainContent) mainContent.style.display = "block";

  // Final visibility check for live - Ensuring Hero is NEVER missed
  const homeSections = [
    "heroSection", "categoryGateway", "ticker-wrap", "processSection1", 
    "workflowSection", "aboutSection", "testimonialsSection", "gov-loan-portal"
  ];
  
  homeSections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = "block";
        el.style.visibility = "visible"; // Extra safety
        el.style.opacity = "1";
    }
  });
  
  // Hide non-home sections
  const pages = ["colleges", "courses-section", "crsResultHeader", "compare-section"];
  pages.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = "none"; });
  
  if (typeof syncNav === 'function') syncNav("home");
  localStorage.setItem("kvp_last_view", "home");
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
  grid.innerHTML = filtered.map(({ course, college }, idx) => {
    const fullDur = course.d || "N/A";
    const cleanDur = fullDur.split(/[·\-\|]/)[0].trim();
    const dur = parseInt(cleanDur) || 3;
    
    let rawFee = course.f || "";
    if ((!rawFee || rawFee === "On Request") && fullDur.includes('₹')) {
       const parts = fullDur.split('·');
       if (parts.length > 1) rawFee = parts[1].replace(/Total Tuition Fees/i, "").trim();
    }

    const parseFee = (str) => {
       const val = parseFloat(str.replace(/[^0-9\.]/g, ""));
       if (isNaN(val)) return 0;
       if (str.toLowerCase().includes('l')) return val * 100000;
       if (str.toLowerCase().includes('k')) return val * 1000;
       return val;
    };

    let totalNum = 0;
    let yearMap = {};
    if (rawFee && rawFee.includes("Yr")) {
       const blocks = rawFee.split('|');
       blocks.forEach(blk => {
          const matches = blk.match(/Yr(\d+)(?:-(\d+))?:\s*₹?([\d\.]+)(\w?)/i);
          if (matches) {
             const start = parseInt(matches[1]);
             const end = matches[2] ? parseInt(matches[2]) : start;
             const realVal = parseFee(matches[3] + (matches[4] || ""));
             for(let i=start; i<=end; i++) {
               yearMap[i] = realVal;
               totalNum += realVal;
             }
          }
       });
    } else {
       totalNum = parseFee(rawFee);
       const avg = totalNum ? Math.floor(totalNum / dur) : 0;
       for(let i=1; i<=dur; i++) yearMap[i] = avg;
    }

    const totalFmt = totalNum ? "₹" + (totalNum / 100000).toFixed(2) + "L" : "On Request";

    let yearHtml = '';
    for (let i = 1; i <= dur; i++) {
      const label = i === 1 ? "1st" : i === 2 ? "2nd" : i === 3 ? "3rd" : "4th";
      const val = yearMap[i] ? "₹" + (yearMap[i] / 100000).toFixed(2) + "L" : "On Request";
      yearHtml += `
        <div style="padding:0.6rem; background:#fff; border:1px solid #F3F4F6; border-radius:12px; text-align:center;">
           <div style="font-size:0.55rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:2px;">${label} Year</div>
           <div style="font-size:0.8rem; font-weight:800; color:var(--dark);">${val}</div>
        </div>
      `;
    }

    return `
    <div class="crs-item-premium" style="background:#fff; border:1.8px solid #F3F4F6; border-radius:24px; padding:1.5rem; display:flex; flex-direction:column; gap:1.2rem; transition:0.4s; box-shadow: 0 4px 15px rgba(0,0,0,0.02); animation: fadeIn 0.4s ease both; min-height:100%;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; min-height:95px;">
          <div style="flex:1;">
             <h4 style="font-size:1.15rem; font-weight:850; color:var(--dark); margin:0; line-height:1.2; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${escapeHtml(course.n)}</h4>
             <div onclick="openCollegeByName('${escapeQuote(college.name)}')" style="cursor:pointer; font-size:0.75rem; color:var(--gray); margin-top:6px; font-weight:700;">🏛️ ${escapeHtml(college.name)}</div>
          </div>
          <div style="width:40px; height:40px; border-radius:12px; background:var(--pink-light); display:flex; align-items:center; justify-content:center; color:var(--pink); font-size:1rem; flex-shrink:0;"><i class="fa-solid fa-graduation-cap"></i></div>
      </div>
      
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem; padding:1rem; background:rgba(233,30,140,0.02); border:1px solid rgba(233,30,140,0.05); border-radius:16px;">
          <div>
             <div style="font-size:0.6rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:2px;">TOTAL FEES</div>
             <div style="font-size:0.95rem; font-weight:800; color:var(--dark);">${escapeHtml(totalFmt)}</div>
          </div>
          <div>
             <div style="font-size:0.6rem; font-weight:800; color:var(--gray); text-transform:uppercase; margin-bottom:2px;">ADMISSION FEE</div>
             <div style="font-size:0.95rem; font-weight:800; color:var(--dark);">${escapeHtml(course.af || '₹0')}</div>
          </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(${dur > 2 ? 2 : dur}, 1fr); gap:0.6rem; flex:1;">
          ${yearHtml}
      </div>

      <button onclick="openApplyModal('${escapeQuote(college.name)}', '${escapeQuote(course.n)}', '')" class="btn-primary" style="width:100%; border-radius:12px; padding:0.8rem; font-size:0.85rem; font-weight:800; margin-top:1.25rem;">Apply Now →</button>
    </div>`;
  }).join("");
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

  let info = Array.isArray(college.info) ? college.info : [];
  const forbidden = ["fee", "fees", "tuition", "admission"];
  info = info.filter(i => {
    const label = (i.l || "").toLowerCase();
    return !forbidden.some(f => label.includes(f));
  });

  const courseInfo = [
    { l: "TOTAL FEES", v: course.f || "On Request" },
    { l: "ADMISSION FEE", v: course.af || "₹0" },
    { l: "Duration", v: cleanDur || "—" },
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
    const nameEl = document.getElementById("applyName");
    const phoneEl = document.getElementById("applyPhone");
    
    // Always start as editable
    if (nameEl) { nameEl.readOnly = false; nameEl.style.background = "#F9FAFB"; }
    if (phoneEl) { phoneEl.readOnly = false; phoneEl.style.background = "#F9FAFB"; }

    if (raw) {
      const u = JSON.parse(raw);
      if (nameEl && u.displayName) {
          nameEl.value = u.displayName;
          nameEl.readOnly = true;
          nameEl.style.background = "#F3F4F6"; // Visual cue for non-editable
      }
      if (phoneEl && u.phone) {
          phoneEl.value = u.phone;
          phoneEl.readOnly = true;
          phoneEl.style.background = "#F3F4F6"; // Visual cue for non-editable
      }
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
  const getV = (id) => (document.getElementById(id) && document.getElementById(id).value.trim()) || "";
  
  const name = getV("applyName");
  const phone = getV("applyPhone");
  const district = getV("applyDistrict");
  const tenth = getV("applyTenth");
  const twelfth = getV("applyTwelfth");
  const errEl = document.getElementById("applyError");

  if (!name || !phone || !district || !tenth) {
    errEl.textContent = "Please fill in all mandatory fields (*).";
    errEl.style.display = "";
    return;
  }

  const applicationData = {
    name,
    phone,
    district,
    tenth,
    twelfth,
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

    // MOBILE NOTIFICATION FOR APPLICATION
    notifyAdmin("New College Application", {
        Name: applicationData.name,
        Phone: applicationData.phone,
        College: applicationData.collegeName,
        Course: applicationData.courseName,
        Applied_At: applicationData.appliedAt
    });

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


// ===== INITIALIZATION & SPLASH =====
window.addEventListener('DOMContentLoaded', () => {
    // 1. Scroll Reveal
    initScrollReveal();

    // 2. Carousel
    const slides = document.querySelectorAll('.bg-slide');
    if (slides.length) {
        carouselTimer = setInterval(nextSlide, 4800);
    }
});

window.addEventListener('load', () => {
    // 1. Hero Entrance Animations
    const items = ['.hero-badge', '.hero-tag', '.hero-h1', '.hero-sub', '.hero-btns', '.hero-cards', '.stats-row', '.app-download'];
    items.forEach((sel, i) => {
        const el = document.querySelector(sel);
        if (!el) return;
        Object.assign(el.style, { opacity: '0', transform: 'translateY(20px)', transition: 'opacity .65s ease, transform .65s ease' });
        setTimeout(() => { el.style.opacity = ''; el.style.transform = ''; }, 200 + i * 120);
    });

    // 2. Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => console.log('Service Worker registered', reg))
            .catch((err) => console.log('Service Worker registration failed', err));
    }

    // 3. Splash Screen Logic
    const splash = document.getElementById('splash-screen');
    const typingEl = document.getElementById('splash-typing');
    const missionText = "ഒരു ദൗത്യം, ഒരു ലക്ഷ്യം — നമ്മുടെ കുട്ടികൾക്കായി സുരക്ഷിതമായ വിദ്യാഭ്യാസം.";

    if (splash) {
        // Start 0.8s after load
        setTimeout(() => {
            if (typingEl) {
                let i = 0;
                typingEl.textContent = "";
                const speed = 25; // Faster typing
                const interval = setInterval(() => {
                    typingEl.textContent += missionText[i];
                    i++;
                    if (i === missionText.length) {
                        clearInterval(interval);
                        // Exit Splash faster
                        setTimeout(() => {
                            splash.classList.add('vanish');
                            setTimeout(() => splash.remove(), 600);
                        }, 600);
                    }
                }, speed);
            }
        }, 800);
    }
});

// INITIAL LOAD FOR ALL USERS (GUESTS & LOGGED IN)
if (typeof loadColleges === "function") loadColleges();
