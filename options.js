window.addEventListener("load", init);

async function updateValues() {
    let fokus = "F"; // Folder, fallback.
    if (document.getElementById("nachricht").checked == true) {
       fokus = "N";
    }
    if (document.getElementById("ungelesen").checked == true) {
        fokus = "U";
    }

    let liste = document.getElementById("selectliste");
    // alert(liste.options[liste.selectedIndex].value);
    await browser.storage.local.set({
        accountnummer: liste.options[liste.selectedIndex].value,
        unified: document.getElementById("unified_id").checked,
        fokus
    });
}

async function init() {
    let acc_liste = await browser.runtime.sendMessage({
        nachricht: "hole Konten"
    });

    let prefs = await browser.runtime.sendMessage({
        nachricht: "hole Einstellungen"
    });
    
    var select = document.getElementById("selectliste");
    for (var i = 0; i < Object.keys(acc_liste).length; i++) {
        option = document.createElement('option');
        option.setAttribute('value', i);
        option.text = acc_liste[i].name;
        //console.log(option.text);
        select.appendChild(option);
    }
    select.selectedIndex = prefs.accountnummer;

    if (prefs.unified == true) {
        document.getElementById("unified_id").checked = true;
    } else {
        document.getElementById("unified_id").checked = false;
    }

    // N-->fokus auf letze nachricht setzen   U-->fokus auf erste ungelesene nachricht setzen  F-->fokus auf inbox-ordner setzen
    if (prefs.fokus == "N") {
        document.getElementById("nachricht").checked = true;
    } else if (prefs.fokus == "U") {
        document.getElementById("ungelesen").checked = true;
    } else {
        document.getElementById("ordner").checked = true;
    }

    document.getElementById("unified_id").addEventListener("change", updateValues);
    document.getElementById("nachricht").addEventListener("change", updateValues);
    document.getElementById("ungelesen").addEventListener("change", updateValues);
    document.getElementById("ordner").addEventListener("change", updateValues);
    document.getElementById("selectliste").addEventListener("change", updateValues);

} // klammer zu von init
