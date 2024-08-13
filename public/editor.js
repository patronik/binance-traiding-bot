// Initialize the Ace Editor
var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/javascript");

let editorInitialContent = getCookie('editorContent');

if (editorInitialContent != null) {
  editorInitialContent = atob(editorInitialContent);
} else {
  editorInitialContent = `
/**
    Variables available:
    let currentBtcPrice; let currentBtcBalance; let currentUsdtBalance;

    Html buttons available:
    document.getElementById('sellAllBtn');
    document.getElementById('sellSpecificBtn');
    document.getElementById('clearFieldsBtn');
    document.getElementById('buySpecificBtn');

    Html elements available:
    document.getElementById('buyAmount');
    document.getElementById('sellAmount');
    document.getElementById("executeCheckbox").checked;
**/
`;
}

editor.setValue(editorInitialContent);

editor.on('input', () => {
  setCookie('editorContent', btoa(editor.getValue()), 7);
});

// Function to execute code
function runCallback()
{
  var shouldExecute = document.getElementById("executeCheckbox").checked;
  if (shouldExecute) {
    try {
      var code = editor.getValue();
      eval(code);
    } catch (e) {
      console.error("Error executing code:", e);
    }
  }
}

