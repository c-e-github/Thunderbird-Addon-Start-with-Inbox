var acc_liste = new Object();

async function leseordner(startaccount, unifiedinbox, fokus) {  // aufgerufen am ende von function pref_lesen()
   let accs = await messenger.accounts.list();
   for (var i = 0; i < accs.length; i++) { // alle accounts durchlaufen und namen aufzeichnen
      if (accs[i].type != "none") {
         // console.log(accs[i].name);
         acc_liste[i] = accs[i].name;
      }
   }
   // console.log(acc_liste);
   // console.log("accounts", accs);
   //console.log("fokus", fokus);


   var lastmail = {};
   var Ugefunden = false;
   if (fokus == "F") { // fokus soll auf folder gesetzt werden --> lesen der nachrichten nicht erforderlich
      lastmail.id = -99;
   } else {
      let inboxFolders = await messenger.accounts.list().then(accts =>
         accts.map(acct =>
            acct.folders.find(folder => folder.type === "inbox")
         )
      );
      // returns an array, length = number of accounts, each element is a MailFolder object representing the inbox of each account.
      // If only one account, index is 0 / contents can be listed with messenger.messages.list
      //console.log(inboxFolders.length);
      //console.log("xxx", inboxFolders[startaccount]);
      let inboxMessages = await messenger.messages.list(inboxFolders[startaccount]);
         for (let message of inboxMessages.messages) {
            if (message.read == false){ // finden der ersten ungelesenen mail
               lastmail = message; // erste ungelesene mail
               Ugefunden = true;
               break;
            }
         }

         while (inboxMessages.id) { // alle list-pages durchlaufen
            inboxMessages = await messenger.messages.continueList(inboxMessages.id);

            for (let message of inboxMessages.messages) {
               if (message.read == false){ // finden der ersten ungelesenen mail
                  lastmail = message; // erste ungelesene mail
                  Ugefunden = true;
                  break;
               }
            }
         }

      var letzteNr = inboxMessages.messages.length;
      // console.log(letzteNr);

      if (letzteNr == "0") { // keine mails in der inbox
         lastmail.id = -99;
      } else {
         if (fokus == "U") { // fokus soll auf erste ungelesene mail gesetzt werden, oben schon identifiziert
            if (Ugefunden == false) { // keine ungelesene mail vorhanden --> fokus auf letzte mail
               lastmail = inboxMessages.messages[letzteNr - 1]; // fokus soll auf letzte mail gesetzt werden
            }
         } else { // fokus-option muss jetzt "N" sein
            lastmail = inboxMessages.messages[letzteNr - 1]; // fokus soll auf letzte mail gesetzt werden
         }
      }
   }
   //console.log(lastmail.id, startaccount, acc_liste[startaccount], unifiedinbox);
   browser.myapi.selectmessage(lastmail.id, acc_liste[startaccount], unifiedinbox, fokus); // aufruf von implementation.js
}

//------ prefs einlesen --------------------------------
async function pref_lesen() {
   let default_value = "0";
   let { accountnummer } = await browser.storage.local.get({ "accountnummer": default_value });
   var unifiedinbox = false;
   let uinbox = await browser.storage.local.get("unified"); // liefert object mit eigenschaft "unified"
   //   console.log(uinbox);
   unifiedinbox = uinbox.unified;
   if (typeof unifiedinbox == "undefined") { // z.b. nach erstinstallation, wenn pref "unified" noch nicht existiert
      unifiedinbox = false;
    }
   var fokus = "F";
   let uf = await browser.storage.local.get("fokus"); // liefert object mit eigenschaft "fokus"
   //console.log(uf);
   fokus = uf.fokus;
   if (typeof fokus == "undefined") { // z.b. nach erstinstallation, wenn pref "fokus" noch nicht existiert
      fokus = "F";
    }
   try {
      leseordner(accountnummer, unifiedinbox, fokus);
   } catch (error) {
      console.log(`Error=${error}`);
   }
}
pref_lesen();


// -------------------sendmessage aus options.js verarbeiten -------------------
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
   async function handle_acc_liste() {
      return { response: acc_liste };
   }

   async function handle_startaccount() {
      let default_value = "0";
      try {
         let { accountnummer } = await browser.storage.local.get({ "accountnummer": default_value });
         //console.log(accountnummer);
         return { response: accountnummer };
      } catch (error) {
         console.log(`Error=${error}`);
         return { response: default_value };
      }
   }

   async function handle_unified() {
      var unifiedinbox = false;
      try {
         let uinbox = await browser.storage.local.get("unified"); // liefert object mit eigenschaft "unified"
         unifiedinbox = uinbox.unified;
//         console.log(unifiedinbox);
         return { response: unifiedinbox };
      } catch (error) {
         console.log(`Error=${error}`);
         unifiedinbox = false;
         return { response: unifiedinbox };
      }
   }

   async function handle_fokus() {
      var fokus = "F";
      try {
         let uf = await browser.storage.local.get("fokus"); // liefert object mit eigenschaft "unified"
         fokus = uf.fokus;
         // console.log(fokus);
         return { response: fokus };
      } catch (error) {
         console.log(`Error=${error}`);
         fokus = "F";
         return { response: fokus };
      }
   }

   async function handle_installation() {
      let accs = await messenger.accounts.list();
      for (var i = 0; i < accs.length; i++) { // alle accounts durchlaufen und namen aufzeichnen
         if (accs[i].type != "none") {
            // console.log(accs[i].name);
            acc_liste[i] = accs[i].name;
         }
      }
      return { response: acc_liste };
   }

   switch (request.nachricht) {
      case "hole acc_liste":
         return handle_acc_liste();

      case "hole unifiedinbox":
         return handle_unified();

      case "hole fokus":
         return handle_fokus();

      case "hole startaccount":
         return handle_startaccount();

      case "nach installation":
         return handle_installation();
   }
});