var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { MailUtils } = ChromeUtils.import("resource:///modules/MailUtils.jsm");
var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

var myapi = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      myapi: {
        async selectmessage(lastmailid, acc_name, unifiedinbox, fokus) {
           let recentWindow = Services.wm.getMostRecentWindow("mail:3pane");
           let tabmail = recentWindow.document.getElementById("tabmail");
           tabmail.switchToTab(0);
           recentWindow.focus();
// ------------------------------------------- ist smart view = unified inbox aktiviert? ------------------------------------
           if (unifiedinbox == true){ // in options gesetzt
              var modus = recentWindow.gFolderTreeView._treeElement.getAttribute("mode", recentWindow.gFolderTreeView._activeModes);
              if (modus.includes("smart")){   // unified folder view aktiv
                 //console.log("smart aktiv");
                 for(var i=0; i < recentWindow.gFolderTreeView._rowMap.length; i++){ // foldertree durchlaufen
                    // console.log(recentWindow.gFolderTreeView._rowMap[i]._mode);
                    if(recentWindow.gFolderTreeView._rowMap[i]._mode == "smart"){
                       recentWindow.gFolderTreeView.selection.select(i+1);
                       recentWindow.document.getElementById("folderTree").focus();
                       if (fokus == "F") { // fokus soll auf inbox-folder gesetzt werden
                          recentWindow.document.getElementById("folderTree").focus();
                          return;
                       }
                       //console.log("dbview:", recentWindow.gFolderDisplay.view.dbView);
                       var merker = 0;
                       var h_merker = {};
                       for(var m=0; m < recentWindow.gFolderDisplay.view.dbView.rowCount; m++){ // messages durchlaufen
                          let MHdr = recentWindow.gFolderDisplay.view.dbView.getMsgHdrAt(m);
                          //console.log("count:", m);
                          //console.log("mhdr:", MHdr);
                          //console.log("date in s:", MHdr.dateInSeconds);
                          if (fokus == "U") { // fokus soll auf erste ungelesene mail gesetzt werden
                             if (MHdr.isRead == false) { // erste ungelesene mail
                                recentWindow.gFolderDisplay.selectMessage(MHdr);
                                recentWindow.gFolderDisplay.tree.focus();
                                return;
                             }
                          }
                          // fokus muss jetzt "N" sein; fokus auf letze nachricht setzen
                          if (MHdr.dateInSeconds > merker) { // datumswert größer als letzter --> neuer
                             merker = MHdr.dateInSeconds;
                             h_merker = MHdr
                          }
                       }
                       //console.log("merker:", merker);
                       if (merker > 0) {
                          recentWindow.gFolderDisplay.selectMessage(h_merker); // neueste mail in unified inboc
                          recentWindow.gFolderDisplay.tree.focus();
                       } else { // keine mails in unified inbox
                          recentWindow.document.getElementById("folderTree").focus();
                       }
                       return;
                    }
                 }
              }
           }
//---------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------- smart view = unified inbox NICHT aktiviert -----------------------------------
           if (recentWindow) {
              //console.log("accounts:", MailServices.accounts);
              for(var i=0; i<MailServices.accounts.allServers.length; i++){ // accounts durchlaufen und richtigen finden
                 if (MailServices.accounts.allServers[i].prettyName == acc_name) {
                    //console.log("acc-folders:", MailServices.accounts.allServers[i].rootFolder);
                    let rootFolder = MailServices.accounts.allServers[i].rootFolder;
                    let inboxFolder = [rootFolder, ...rootFolder.subFolders].find(folder => folder.flags & Ci.nsMsgFolderFlags.Inbox)
                    //console.log("inbox-folder:", inboxFolder);

// console.log("foldertree:", recentWindow.gTabmail.tabInfo[0].chromeBrowser.contentWindow.folderTree);

                    recentWindow.gTabmail.tabInfo[0].folder = inboxFolder;

                    recentWindow.gTabmail.tabInfo[0].chromeBrowser.contentWindow.folderTree._selectedRow.focus; // funktioniert nicht!
//                    recentWindow.document.getElementById("folderTree").focus();
                 }
              }
           }
           if(lastmailid == -99){ // keine mails in der inbox oder option F "focus auf folder"
              return;
           } else { // mindestens eine mail in der inbox
              if (fokus == "N") { // fokus soll auf letzte mail gesetzt werden
                 var merker = 0;
                 var h_merker = {};
                 for(var m=0; m < recentWindow.gFolderDisplay.view.dbView.rowCount; m++){ // messages durchlaufen
                    let MHdr = recentWindow.gFolderDisplay.view.dbView.getMsgHdrAt(m);
                    //console.log("count:", m);
                    //console.log("mhdr:", MHdr);
                    //console.log("date in s:", MHdr.dateInSeconds);
                    if (MHdr.dateInSeconds > merker) { // datumswert größer als letzter --> neuer
                       merker = MHdr.dateInSeconds;
                       h_merker = MHdr
                    }
                 }
                 //console.log("merker:", merker);
                 recentWindow.gFolderDisplay.selectMessage(h_merker); // neueste mail
                 recentWindow.gFolderDisplay.tree.focus();
                 return;
              }
              // fokus muss jetzt U sein, also erste ungelesene mail finden
              let lastmessage = context.extension.messageManager.get(lastmailid) //lastmailid in background.js ermittelt
              //console.log("lastmessage", lastmessage);
              if (recentWindow) {
                 recentWindow.gTabmail.tabInfo[0].folder = lastmessage.folder;
                 //console.log("folder:", lastmessage.folder);
                 recentWindow.gFolderDisplay.selectMessage(lastmessage);
                 recentWindow.gFolderDisplay.tree.focus();
              }
           }
        },
      },
    };
  }
};