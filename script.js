"use strict";
const BURN_RATE_PER_KM = 15;
const MAX_XENONITE = 500;
let localAstrophage = 1000;
let localXenonite = 200;
let localMessages = [];
const LOCAL_DICTIONARY = {
    "amaze": "Amaze!",
    "fist": "Fist my bump",
    "good": "Good good good",
    "bad": "Bad bad bad",
    "question": "Question?",
    "fuel": "Astrophage levels normal"
};
const ROW_ICONS = {
    "Fuel Mass": '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/></svg>',
    "Jump Distance": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>',
    "Burn Rate": '<svg viewBox="0 0 24 24"><path d="M12 4a8 8 0 0 0-8 8h3m13 0a8 8 0 0 0-8-8v3m0 5l4-4"/></svg>',
    "Required Fuel": '<svg viewBox="0 0 24 24"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/></svg>',
    "Remaining Fuel": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/></svg>',
    "Max Range": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 12l4-2"/></svg>',
    "Status": '<svg viewBox="0 0 24 24"><polygon points="12 2 15 9 22 9 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9 9 9"/></svg>'
};
function checkFuel(amount) {
    if (isNaN(amount) || amount < 0) {
        return false;
    }
    return true;
}
function checkMessage(text) {
    const pattern = /^[a-zA-Z0-9\s.,!?-]*$/;
    return pattern.test(text);
}
function percent(value, max) {
    if (value <= 0 || max <= 0)
        return 0;
    return Math.min(100, Math.round((value / max) * 100));
}
function setMeter(barId, labelId, value) {
    const bar = document.getElementById(barId);
    const label = document.getElementById(labelId);
    if (bar)
        bar.style.width = value + "%";
    if (label)
        label.innerText = value + "%";
}
function updateGauges(astrophage, xenonite, distance) {
    const requiredFuel = distance * BURN_RATE_PER_KM;
    const remaining = Math.max(0, astrophage - requiredFuel);
    const reqReadout = document.getElementById("required-fuel-readout");
    if (reqReadout)
        reqReadout.innerText = String(requiredFuel);
    setMeter("fuel-progress-bar", "fuel-capacity-value", percent(astrophage, requiredFuel));
    setMeter("xenonite-progress-bar", "xenonite-capacity-value", percent(xenonite, MAX_XENONITE));
    setMeter("reserve-progress-bar", "reserve-capacity-value", percent(remaining, requiredFuel));
}
function showPipeline(pipeline) {
    const list = document.getElementById("jump-status-readout");
    if (!list)
        return;
    list.innerHTML = "";
    const lines = pipeline.split("\n");
    for (const line of lines) {
        const parts = line.split(":");
        if (parts.length < 2)
            continue;
        const key = parts[0].trim();
        const val = parts.slice(1).join(":").trim();
        const row = document.createElement("div");
        row.className = "row";
        const chip = document.createElement("span");
        chip.className = "chip";
        const iconSvg = ROW_ICONS[key] || ROW_ICONS["Status"];
        chip.innerHTML = iconSvg + " " + key;
        const value = document.createElement("span");
        value.className = "value";
        value.innerText = val;
        row.appendChild(chip);
        row.appendChild(value);
        list.appendChild(row);
    }
}
function appendCommsLog(text, isError = false) {
    const logList = document.getElementById("comms-log-list");
    if (!logList)
        return;
    const div = document.createElement("div");
    div.className = isError ? "log-entry error" : "log-entry";
    div.innerText = "[" + new Date().toLocaleTimeString() + "] " + text;
    logList.appendChild(div);
    logList.scrollTop = logList.scrollHeight;
}
function applyState(astrophage, xenonite, distance, pipeline, logText, message, translation) {
    localAstrophage = astrophage;
    localXenonite = xenonite;
    const astroReadout = document.getElementById("astrophage-readout");
    const xenoReadout = document.getElementById("xenonite-readout");
    const logOutput = document.getElementById("captains-log-output");
    if (astroReadout)
        astroReadout.innerText = String(astrophage);
    if (xenoReadout)
        xenoReadout.innerText = String(xenonite);
    if (pipeline)
        showPipeline(pipeline);
    if (logOutput && logText)
        logOutput.innerText = logText;
    if (message && translation) {
        appendCommsLog(message + " -> " + translation);
    }
    updateGauges(astrophage, xenonite, distance);
}
function sendPayload(includeMessage) {
    const astroInput = document.getElementById("astrophage-input");
    const xenoInput = document.getElementById("xenonite-input");
    const distInput = document.getElementById("distance-input");
    const freqInput = document.getElementById("frequency-input");
    const activeBtn = document.getElementById(includeMessage ? "transmit-btn" : "calculate-jump-btn");
    const defaultBtnLabel = includeMessage ? "Transmit" : "Calculate Jump";
    const astrophage = Number(astroInput.value);
    const xenonite = Number(xenoInput.value);
    const distance = distInput ? Number(distInput.value) : 100;
    const message = includeMessage ? freqInput.value.trim() : "";
    if (!checkFuel(astrophage) || !checkFuel(xenonite)) {
        appendCommsLog("Safety Protocol: Fuel inputs cannot be negative!", true);
        return;
    }
    if (!checkFuel(distance) || distance <= 0) {
        appendCommsLog("Safety Protocol: Jump distance must be greater than 0 km!", true);
        return;
    }
    if (includeMessage && (message.length === 0 || !checkMessage(message))) {
        appendCommsLog("Safety Protocol: Empty message or invalid special characters!", true);
        return;
    }
    if (activeBtn) {
        activeBtn.innerText = "Transmitting...";
        activeBtn.classList.add("transmitting");
    }
    fetch("/update", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            astrophage: astrophage,
            xenonite: xenonite,
            distance: distance,
            message: message
        })
    })
        .then(response => {
        if (!response.ok) {
            throw new Error("Server error " + response.status);
        }
        return response.json();
    })
        .then(data => {
        if (activeBtn) {
            activeBtn.innerText = defaultBtnLabel;
            activeBtn.classList.remove("transmitting");
        }
        const requiredFuel = distance * BURN_RATE_PER_KM;
        const pipeline = data.pipeline || ("Fuel Mass: " + data.astrophage + " kg\n" +
            "Jump Distance: " + distance + " km\n" +
            "Burn Rate: 15 kg/km\n" +
            "Required Fuel: " + requiredFuel + " kg\n" +
            "Remaining Fuel: " + (Number(data.astrophage) - requiredFuel) + " kg\n" +
            "Max Range: " + Math.floor(Number(data.astrophage) / 15) + " km\n" +
            "Status: " + (Number(data.astrophage) < requiredFuel ? "Not Enough Fuel" : "Fuel is enough"));
        applyState(Number(data.astrophage), Number(data.xenonite), distance, pipeline, data.log || "", includeMessage ? message : "", data.translation || "");
        if (includeMessage)
            freqInput.value = "";
        astroInput.value = "0";
        xenoInput.value = "0";
    })
        .catch(() => {
        if (activeBtn) {
            activeBtn.innerText = defaultBtnLabel;
            activeBtn.classList.remove("transmitting");
        }
        const newAstro = localAstrophage + astrophage;
        const newXeno = localXenonite + xenonite;
        const requiredFuel = distance * BURN_RATE_PER_KM;
        const remaining = newAstro - requiredFuel;
        const maxRange = Math.floor(newAstro / BURN_RATE_PER_KM);
        const status = newAstro < requiredFuel ? "Not Enough Fuel" : "Fuel is enough";
        const pipeline = "Fuel Mass: " + newAstro + " kg\n" +
            "Jump Distance: " + distance + " km\n" +
            "Burn Rate: 15 kg/km\n" +
            "Required Fuel: " + requiredFuel + " kg\n" +
            "Remaining Fuel: " + remaining + " kg\n" +
            "Max Range: " + maxRange + " km\n" +
            "Status: " + status;
        let translation = "";
        if (includeMessage && message) {
            const words = message.toLowerCase().split(/\s+/);
            translation = words.map(w => LOCAL_DICTIONARY[w] || w).join(" ");
            localMessages.push(message + " -> " + translation);
            localMessages.sort();
        }
        const logText = "=== CAPTAIN'S LOG ===\n\n" +
            "--- REACTOR STATUS ---\n" + pipeline + "\n\n" +
            "--- COMMUNICATIONS LOG (SORTED) ---\n" +
            (localMessages.length > 0 ? localMessages.join("\n") : "No communications logged yet.");
        applyState(newAstro, newXeno, distance, pipeline, logText, includeMessage ? message : "", translation);
        if (includeMessage)
            freqInput.value = "";
        astroInput.value = "0";
        xenoInput.value = "0";
    });
}
function downloadCaptainsLog() {
    const logOutput = document.getElementById("captains-log-output");
    const content = logOutput ? logOutput.innerText : "";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Captains_Log.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
document.addEventListener("DOMContentLoaded", () => {
    const jumpBtn = document.getElementById("calculate-jump-btn");
    const transmitBtn = document.getElementById("transmit-btn");
    const downloadBtn = document.getElementById("download-log-btn");
    const freqInput = document.getElementById("frequency-input");
    const distInput = document.getElementById("distance-input");
    if (jumpBtn) {
        jumpBtn.addEventListener("click", () => sendPayload(false));
    }
    if (transmitBtn) {
        transmitBtn.addEventListener("click", () => sendPayload(true));
    }
    if (downloadBtn) {
        downloadBtn.addEventListener("click", downloadCaptainsLog);
    }
    if (freqInput) {
        freqInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                sendPayload(true);
            }
        });
    }
    if (distInput) {
        distInput.addEventListener("change", () => sendPayload(false));
        distInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                sendPayload(false);
            }
        });
    }
    updateGauges(1000, 200, 100);
    sendPayload(false);
});
