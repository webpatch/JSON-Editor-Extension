(function(){
	app.load();
	app.resize();
	reloadEditor(self.options.jsonText)
	
	function reloadEditor(data){
		app.setData(data);
		codeEditor.format();
	}

	function getE(id)
	{
		const i = id.charAt(0);
		id = id.substr(1);
		if(i =='#'){
			return document.getElementById(id);
		}else if(i == '.'){
			return document.getElementsByClassName(id)[0];
		}
		return null;
	}

	getE(".poweredBy").onclick = function(e){
		e.preventDefault();
		app.notify.showNotification("Text copied to clipboard!",1500);
		self.port.emit("copy",codeEditor.getText());
	};
	
	var btn = getE("#reloadBtn");
	btn.onclick = function(){
		self.port.emit("reload",input.value);
	};

	var input = getE("#inputURL");
	input.value = self.options.url;
	input.onkeypress = function(e){
		if(e.keyCode == 13){
			self.port.emit("reload",input.value);
			return false;
		}
	}

	self.port.on('reloadSuccess',function(txt){
		reloadEditor(txt);
		input.blur();
		input.focus();
	});

	self.port.on('reloadFail',function(txt){
		txt =  txt || "";
		app.notify.showError("Reload failed!\n"+txt);
	});

})(window);