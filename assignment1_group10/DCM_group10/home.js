const userItem = document.getElementById("itm-user");
const logoutItem = document.getElementById("itm-logout");
const connectButton = document.getElementById("btn-connect");
const alertPlaceholder = document.getElementById('liveAlertPlaceholder');

const dsnInput = document.getElementById("input-dsn");
const dsnButton = document.getElementById("btn-dsn");

const pacingModeInput = document.getElementById("select-pacing");
const saveButton = document.getElementById("btn-save");
const lrlInput = document.getElementById("input-range-lrl");
const urlInput = document.getElementById("input-range-url");
const aaInput = document.getElementById("input-range-aa");
const apwInput = document.getElementById("input-range-apw");
const vaInput = document.getElementById("input-range-va");
const vpwInput = document.getElementById("input-range-vpw");
const vrpInput = document.getElementById("input-range-vrp");
const arpInput = document.getElementById("input-range-arp");
const lrlText = document.getElementById("text-lrl");
const urlText = document.getElementById("text-url");
const aaText = document.getElementById("text-aa");
const apwText = document.getElementById("text-apw");
const vaText = document.getElementById("text-va");
const vpwText = document.getElementById("text-vpw");
const vrpText = document.getElementById("text-vrp");
const arpText = document.getElementById("text-arp");

const currentUser = User.currentUser;
if (currentUser) {
  userItem.textContent = currentUser.username;
  if (currentUser.data.dsn) {
    dsnInput.value = currentUser.data.dsn;
  }
}

logoutItem.addEventListener('click', () => {
  currentUser.logout();
  window.location.href = "index.html";
});

dsnButton.addEventListener('click', () => {
  if (dsnInput.disabled) {
    dsnInput.disabled = false;
    dsnButton.innerText = "Save";
  } else {
    currentUser.data.dsn = dsnInput.value;
    currentUser.update();
    dsnInput.disabled = true;
    dsnButton.innerText = "Update";
  }
});

let deviceConnected = false;
connectButton.addEventListener('click', () => {
  if (currentUser.data.dsn) {
    if (deviceConnected) {
      customAlert(`Device (S/N ${currentUser.data.dsn}) disconnected`, "warning");
      connectButton.className = "btn btn-success";
      connectButton.innerText = "Connect Device";
      deviceConnected = false;
    } else {
      connectButton.disabled = true;
      customAlert(`Connecting Device (S/N ${currentUser.data.dsn}) please wait...`, "warning");
      setTimeout(() => {
        customAlert(`Device (S/N ${currentUser.data.dsn}) successfully connected!`, "success");
        connectButton.className = "btn btn-danger";
        connectButton.innerText = "Disconnect Device";
        connectButton.disabled = false;
        deviceConnected = true;
      }, 3500);
    }
  }
});

pacingModeInput.addEventListener('input', () => {
  if (currentUser.data.params) {
    if (currentUser.data.params[pacingModeInput.value]) {
      [lrlInput, urlInput, aaInput, apwInput,
        vaInput, vpwInput, vrpInput, arpInput].forEach(input => {
        const value = currentUser.data.params[pacingModeInput.value][input.id.split('-')[2]];
        if (value != null) {
          input.value = value;
        }
      });
    }
  }

  switch (pacingModeInput.value) {
    case "aoo":
      saveButton.disabled = false;
      lrlInput.disabled = false;
      urlInput.disabled = false;
      aaInput.disabled = false;
      apwInput.disabled = false;
      vaInput.disabled = true; vaInput.value = "";
      vpwInput.disabled = true; vpwInput.value = "";
      vrpInput.disabled = true;
      arpInput.disabled = true;
      break;
    case "voo":
      saveButton.disabled = false;
      lrlInput.disabled = false;
      urlInput.disabled = false;
      aaInput.disabled = true;
      apwInput.disabled = true;
      vaInput.disabled = false;
      vpwInput.disabled = false;
      vrpInput.disabled = true;
      arpInput.disabled = true;
      break;
    case "vvi":
      saveButton.disabled = false;
      lrlInput.disabled = false;
      urlInput.disabled = false;
      aaInput.disabled = true;
      apwInput.disabled = true;
      vaInput.disabled = false;
      vpwInput.disabled = false;
      vrpInput.disabled = false;
      arpInput.disabled = true;
      break;
    default:
      saveButton.disabled = true;
      lrlInput.disabled = true;
      urlInput.disabled = true;
      aaInput.disabled = true;
      apwInput.disabled = true;
      vaInput.disabled = true;
      vpwInput.disabled = true;
      vrpInput.disabled = true;
      arpInput.disabled = true;
      break;
  }

  updateAllLabels();
});

saveButton.addEventListener('click', async () => {
  params = {};
  [lrlInput, urlInput, aaInput, apwInput,
    vaInput, vpwInput, vrpInput, arpInput].forEach(input => {
    if (input.disabled == false) {
      params[input.id.split('-')[2]] = input.value;
    }
  });

  if (currentUser.data.params == null) {
    currentUser.data.params = {};
  }
  currentUser.data.params[pacingModeInput.value] = params;
  currentUser.update();
});

function updateAllLabels() {
  lrlText.value = lrlInput.value;
  urlText.value = urlInput.value;
  aaText.value = aaInput.value;
  apwText.value = apwInput.value;
  vaText.value = vaInput.value;
  vpwText.value = vpwInput.value;
  vrpText.value = vrpInput.value;
  arpText.value = arpInput.value;
}

function customAlert(message, type) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible fade show" role="alert">`,
    `   <div>&#9432; ${message}</div>`,
    `   <button type="button" id="btn-alert-${type}" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`,
    '</div>'
  ].join('');

  alertPlaceholder.append(wrapper);

  setTimeout(() => {
    document.getElementById(`btn-alert-${type}`).click();
  }, 3500);
}