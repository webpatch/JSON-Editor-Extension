app.load()
app.resize()
app.setData(self.options.jsonText)
codeEditor.format()
document.getElementsByClassName("poweredBy")[0].onclick = function(e){
	e.preventDefault();
	app.notify.showNotification("Text copied to clipboard!",1500);
	self.port.emit("copy",codeEditor.getText())
}