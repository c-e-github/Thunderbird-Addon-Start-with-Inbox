window.addEventListener("load", init);
async function init() {
   // ------------------sendmessage to background.js to get acc_liste-------------
   try {
       let message = await browser.runtime.sendMessage({
           nachricht: "hole acc_liste"
       });
       // console.log(`Message from the background script:  ${message.response}`);
       acc_liste = message.response; // acc_liste aus background.js
   } catch (error) {
       console.log(`Error: ${error}`);
   }
   // ------------------sendmessage to background.js to get startaccount----------
   try {
       let message = await browser.runtime.sendMessage({
           nachricht: "hole startaccount"
       });
       // console.log(`Message from the background script:  ${message.response}`);
       startaccount = message.response; // startaccount aus background.js
   } catch (error) {
       console.log(`Error: ${error}`);
   }
   // ------------------sendmessage to background.js to get unifiedinbox----------
   try {
       let message = await browser.runtime.sendMessage({
           nachricht: "hole unifiedinbox"
       });
       // console.log(`Message from the background script:  ${message.response}`);
       unifiedinbox = message.response; // unifiedinbox aus background.js
   } catch (error) {
       console.log(`Error: ${error}`);
   }
   // ------------------sendmessage to background.js to get fokus----------
   try {
       let message = await browser.runtime.sendMessage({
           nachricht: "hole fokus"
       });
       // console.log(`Message from the background script:  ${message.response}`);
       fokus = message.response; // fokus aus background.js
   } catch (error) {
       console.log(`Error: ${error}`);
   }
//------------------------------------------------------------------------------
   var prefs = {};
   var select = document.getElementById("selectliste");

   if (Object.keys(acc_liste).length == 0){ // unmittelbar nach installation des add-on
      // ------------------sendmessage to background.js to get acc_liste-------------
      try {
          let message = await browser.runtime.sendMessage({
              nachricht: "nach installation"
          });
          // console.log(`Message from the background script:  ${message.response}`);
          acc_liste = message.response; // acc_liste aus background.js
      } catch (error) {
          console.log(`Error: ${error}`);
      }
   }

   for(var i=0; i<Object.keys(acc_liste).length; i++){
      option = document.createElement('option');
      option.setAttribute('value', i);
      option.text =  acc_liste[i];
      //console.log(option.text);
      select.appendChild(option);
   }
   select.selectedIndex = startaccount;
   document.accauswahl.accselect.addEventListener("change", speichern);

   function speichern () {
      liste = document.accauswahl.accselect;
      // alert(liste.options[liste.selectedIndex].value);
      prefs["accountnummer"] = liste.options[liste.selectedIndex].value;
      browser.storage.local.set(prefs);
      // console.log(prefs);
   }

   document.getElementById("unified_id").addEventListener("change", updateValue);
   document.getElementById("nachricht").addEventListener("change", updateValue);
   document.getElementById("ungelesen").addEventListener("change", updateValue);
   document.getElementById("ordner").addEventListener("change", updateValue);
   if (unifiedinbox == true){
      document.getElementById("unified_id").checked = true;
      updateValue();
   } else {
      document.getElementById("unified_id").checked = false;
      updateValue();
   }

// N-->fokus auf letze nachricht setzen   U-->fokus auf erste ungelesene nachricht setzen  F-->fokus auf inbox-ordner setzen
   if (fokus == "N"){
      document.getElementById("nachricht").checked = true;
//      updateValue();
   } else if (fokus == "U") {
      document.getElementById("ungelesen").checked = true;
//      updateValue();
   } else {
      document.getElementById("ordner").checked = true;
  //    updateValue();
   }


   //---------------------------------------------------------------------------
   function updateValue() {
      prefs["unified"] = document.getElementById("unified_id").checked;
      let fok = document.getElementById("nachricht").checked;
      if (document.getElementById("nachricht").checked == true){
         prefs["fokus"] = "N";
      }
      if (document.getElementById("ungelesen").checked == true){
         prefs["fokus"] = "U";
      }
      if (document.getElementById("ordner").checked == true){
         prefs["fokus"] = "F";
      }

      speichern();
   }

//---------------------------------------------------------------------------------------
} // klammer zu von init