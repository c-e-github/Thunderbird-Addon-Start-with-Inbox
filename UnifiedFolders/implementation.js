var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { MailUtils } = ChromeUtils.import("resource:///modules/MailUtils.jsm");
var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

async function setFolder(nativeTabInfo, folder, restorePreviousSelection) {
   let about3Pane = nativeTabInfo.chromeBrowser.contentWindow;
   if (!nativeTabInfo.folder || nativeTabInfo.folder.URI != folder.URI) {
      await new Promise(resolve => {
         let listener = event => {
            if (event.detail == folder.URI) {
               about3Pane.removeEventListener("folderURIChanged", listener);
               resolve();
            }
         };
         about3Pane.addEventListener("folderURIChanged", listener);
         if (restorePreviousSelection) {
            about3Pane.restoreState({
               folderURI: folder.URI,
            });
         } else {
            about3Pane.threadPane.forgetSelection(folder.URI);
            nativeTabInfo.folder = folder;
         }
      });
   }
}

var UnifiedFolders = class extends ExtensionCommon.ExtensionAPI {
   getAPI(context) {
      return {
         UnifiedFolders: {
            async enabled(tabId) {
               // We assume the tabId is a valid mailTab, no error checking.
               let tab = context.extension.tabManager.get(tabId);
               let about3Pane = tab.nativeTab.chromeBrowser.contentWindow;
               return about3Pane.folderPane.activeModes.includes("smart");
            },
            async selectInbox(tabId, mode) {
               // We assume the tabId is a valid mailTab, no error checking.
               let tab = context.extension.tabManager.get(tabId);
               let about3Pane = tab.nativeTab.chromeBrowser.contentWindow;
               if (!about3Pane.folderPane.activeModes.includes("smart")) {
                  return;
               }
               let smartServer = about3Pane.folderPane._modes.smart._smartServer;
               if (!smartServer) {
                  return;
               }
               let smartFolders = MailServices.folderLookup.getFolderForURL(smartServer.rootFolder.URI);
               let inboxFolder = smartFolders.descendants.find(folder => folder.flags & Ci.nsMsgFolderFlags.Inbox);

               // Select the folder, if mode is "folder", restore the last known selection.
               await setFolder(tab.nativeTab, inboxFolder, mode == "folder");

               // If mode is not "folder", we need to select the appropriate message.
               if (mode != "folder") {
                  let msgHdrKey = null;
                  // Loop over all displayed messages.
                  for (var m = 0; m < about3Pane.threadTree.view.rowCount; m++) {
                     let msgHdr = about3Pane.threadTree.view.getMsgHdrAt(m);
                     msgHdrKey = msgHdr.messageKey;
                     if (mode == "first-unread" && msgHdr.isRead == false) {
                        break;
                     }
                  }
                  if (msgHdrKey) {
                     about3Pane.threadTree.view.selectMsgByKey(msgHdrKey);
                  }
               }
            },
         },
      };
   }
};
