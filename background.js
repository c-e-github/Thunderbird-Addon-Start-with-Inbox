// Retrieve all accounts (ignore accounts of type "none").
async function read_accounts() {
   let accounts = await messenger.accounts.list();
   return accounts.filter(acc => acc.type != "none");
}

// Read add-on preferences from local storage (fall back to default values if
// none stored).
async function read_prefs() {
   return browser.storage.local.get({
      accountnummer: "0",
      unified: false,
      fokus: "F"
   });
}

// Finds a message according to the selected mode:
//  - "first-unread": return the first unread message, fallback to the last message
//  - "last": return the last message
// Returns null if no matching message could be found.
async function findMessage(inboxFolder, mode) {
   if (!mode || !["first-unread","last"].includes(mode)) {
      throw new Error("Need to specify mode, either 'last' or 'first-unread'.");
   }
   
   let lastMessage = null;
   let inboxMessages = await messenger.messages.list(inboxFolder);
   while (inboxMessages.messages && inboxMessages.messages.length > 0) { // alle list-pages durchlaufen
      for (let message of inboxMessages.messages) {
         if (mode == "first" && message.read == false) { // finden der ersten ungelesenen mail
            return message; // erste ungelesene mail
         }
         lastMessage = message;
      }
      if (!inboxMessages.id) {
         break;
      }
      inboxMessages = await messenger.messages.continueList(inboxMessages.id);
   }
   return lastMessage;
}

// Select the folder or message based on the provided preferences.
async function selectFolderOrMessage(accountnumber, unifiedinbox, fokus) {
   const MODE_FOR_FOKUS = {
      "U": "first-unread",
      "N": "last",
      "F": "folder"
   };
   let mode = MODE_FOR_FOKUS[fokus];
   
   let accounts = await read_accounts();
   let inboxAccount = accounts[accountnumber]; 
   let inboxFolder = inboxAccount && inboxAccount.folders
      ? inboxAccount.folders.find(folder => folder.type === "inbox")
      : null;

   // console.log({ accounts, inboxAccount, inboxFolder, startaccount, unifiedinbox, fokus});

   let lastMail = inboxFolder && ["first-unread", "last"].includes(mode)
      ? await findMessage(inboxFolder, mode)
      : null;
   
   let mailTabs = await browser.mailTabs.query();
   for (let mailTab of mailTabs) {
      // Unified folders only exist in the UI.
      if (unifiedinbox && browser.UnifiedFolders.enabled(mailTab.id)) {
         await browser.UnifiedFolders.selectInbox(mailTab.id, mode);
      } else {
         if (lastMail) {
            // Select a message.
            await browser.mailTabs.setSelectedMessages(mailTab.id, [lastMail.id]);
         } else {
            // Select a folder.
            await browser.mailTabs.update(mailTab.id, {displayedFolder: inboxFolder});
         }
      }
      await browser.tabs.update(mailTab.id, {active: true});
   }
}

//------- sendmessage aus options.js verarbeiten -------------------------------
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
   switch (request.nachricht) {
      case "hole Konten":
         return read_accounts();

      case "hole Einstellungen":
         return read_prefs();
   }
});

//------ Einstellungen einlesen und Ordner/Nachricht auswählen------------------
async function init() {
   let prefs = await read_prefs();  
   await selectFolderOrMessage(
      prefs.accountnummer, 
      prefs.unified,
      prefs.fokus
   );
}
init();
