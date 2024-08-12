// Initialize the Ace Editor
var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/javascript");

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
  } else {
    // console.log("Code execution is disabled.");
  }
};