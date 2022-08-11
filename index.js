/** Templates de exemplos. */
const Template = {
  /** Exemplo principal. */
  example: document.querySelector("#template-example").innerHTML
};

/** Referências dos elementos HTML usados pela página. */
const Element = {
  /** Container do editor de código principal. */
	codeEditor: document.querySelector("#code-editor"),

  /** Elemento `<pre>` usado para exibir o bytecode exportado. */
  exportCode: document.querySelector("#export-code"),

  /** Botão de executar música. */
  runButton: document.querySelector("#run-button"),

  /** Botão de parar música. */
  stopButton: document.querySelector("#stop-button"),

  /** Botão de exportar para a área de transferência. */
  clipboardButton: document.querySelector("#clipboard-button"),

  /** Aba principal. */
  mainTab: document.querySelector("#main-tab"),

  /** Switch de oitava do teclado. */
  keyboardOctave: document.querySelector("#keyboard-octave"),

  /** Seletor de instrumento do teclado. */
  keyboardInstrument: document.querySelector("#keyboard-instrument"),

  /** Switch para ativar/desativar o uso do teclado como instrumento. */
  keyboardSwitch: document.querySelector("#keyboard-switch"),

  /** Switch para ativar/desativar a inserção automática de notas do teclado. */
  keyboardAutoInsertSwitch: document.querySelector("#keyboard-auto-switch"),

  /** Switch para ativar/desativar a inserção automática dos comandos `wait()` e `wait16()` ao pressionar uma nota do teclado. */
  keyboardWaitInsertSwitch: document.querySelector("keyboard-wait-switch"),

  /** Botão que serve como contador para o comando `wait()` e `wait16()` de inserção automática. */
  keyboardWaitTimer: document.querySelector("#keyboard-wait-timer"),

  /** Tag usada para indicar qual foi a última nota tocada pelo teclado. */
  keyboardLastNote: document.querySelector("#keyboard-last-note")
};

/** Editor de código principal.  */
const codeEditor = CodeMirror(Element.codeEditor, {
	value: localStorage.getItem("code") || Template.example,
	lineNumbers: true,
	mode:  "javascript",
	theme: "friendship-bracelet"
});

/**
 * Executa um scroll de foco no editor de código até a última linha.
 */
function scrollToLastLine() {
  codeEditor.setCursor(codeEditor.lastLine());
}

/**
 * @event onchange
 * Evento acionado ao editar o código.
 * 
 * @param {CodeMirror} cm Referência do editor de código.
 */
codeEditor.on("change", (cm) => {
  localStorage.setItem("code", cm.getValue());
});

/**
 * @class Sample
 * 
 * @description
 * Representa um elemento `<audio>`.
 */
class Sample {
  /**
   * @constructor
   * 
   * @param {string} src Fonte do áudio.
   * @param {string} type MIME Type do áudio.
   * @param {number|null} start Offset de início do áudio.
   * @param {number|null} end Offset de término do áudio.
   */
	constructor(src, type, start = null, end = null) {
    /** Fonte do áudio. */
    this.src = src;

    /** MIME Type do áudio. */
    this.type = type;

    /** Offset de início do áudio. */
    this.start = start;

    /** Offset de término do áudio. */
    this.end = end;

		/** Elemento `<audio>`. */
		this.audioElement  = document.createElement("audio");

		/** Elemento `<source>`. */
		this.sourceElement = document.createElement("source");


		// Definir áudio a ser pré-carregado...
    this.sourceElement.src  = src;
		this.sourceElement.type = type;

		// Montar elemento de áudio...
		this.audioElement.appendChild(this.sourceElement);

    // Auto-referência:
    let self = this;

    // Associar evento de áudio a esta instância...
    this.audioElement.addEventListener("timeupdate", () => {
      // Referência do elemento `<audio>`.
      const e = self.audioElement;

      // Limitar início do áudio...
      if(self.start != null && e.currentTime < self.start) {
        e.currentTime = self.start;
      }

      // Limitar término do áudio...
      else if(self.end != null && e.currentTime > self.end) {
        e.currentTime = 0;
        e.pause();
      }

      // Acionar evento:
      self.update(e);
    });
	}

	/**
	 * Referência do elemento `<audio>`.
	 * 
	 * @returns {HTMLAudioElement}
	 */
	get ref() {
		return this.audioElement;
	}

  /**
   * @event update
   * Evento executado ao escutar o áudio.
   * 
   * @param {HTMLAudioElement} e Referência do elemento.
   */
  update(e) {
  }

	/**
	 * Toca este áudio.
   * 
   * @returns {boolean}
	 */
	play() {
    if(this.audioElement === null || this.audioElement === undefined) {
      return false;
    }

    this.audioElement.pause();
    this.audioElement.currentTime = 0;
		this.audioElement.play();
    return true;
	}

  /**
   * Retrocede este áudio.
   * 
   * @returns {boolean}
   */
  rewind() {
    if(this.audioElement === null || this.audioElement === undefined) {
      return false;
    }

    this.audioElement.currentTime = 0;
    return true;
  }

	/**
	 * Pausa este áudio.
   * 
   * @return {boolean}
	 */
	pause() {
    if(this.audioElement === null || this.audioElement === undefined) {
      return false;
    }

		this.audioElement.pause();
    return true;
	}

	/**
	 * Pausa e reseta este áudio de volta para a posição de origem.
   * 
   * @returns {boolean}
	 */
	reset() {
    if(this.audioElement === null || this.audioElement === undefined) {
      return false;
    }

		this.audioElement.currentTime = 0;
		this.audioElement.pause();
    return true;
	}
}

/**
 * @class SamplePack
 * 
 * @description
 * Representa um pacote de áudio. Serve, essencialmente, como container de
 * notas de vários acordes diferentes.
 */
class SamplePack {
  /**
   * 
   * @param {string} directory Diretório (ver pasta `samples/`).
   * @param {number} length Quantidade de arquivos a serem carregados.
   * @param {number|null} start Offset de início do áudio.
   * @param {number|null} end Offset de término do áudio.
   */
	constructor(directory, length, start = null, end = null) {
    /** Diretório (ver pasta `samples/`). */
		this.directory = directory;

    /** Quantidade de arquivos a serem carregados. */
		this.length = length;

    /** Offset de início dos áudios. */
    this._start = start;

    /** Offset de término dos áudios. */
    this._end = end;

    /** Elementos `<audio>`. */
		this.samples = [];

    // Criar elementos...
		for(let index = 0; index < length; index += 1) {
      const filename = `${index.toString().padStart(2, "0")}.ogg`;
			const src = `./samples/${directory}/${filename}`;
			this.samples.push(new Sample(src, "audio/ogg", start, end));
		}
	}

  /** Offset de início dos áudios. */
  get start() {
    return this._start;
  }

  /** Offset de início dos áudios. */
  set start(value) {
    for(let sample of this.samples) {
      sample.start = value;
    }

    this._start = value;
  }

    /** Offset de término dos áudios. */
    get end() {
      return this._end;
    }
  
    /** Offset de término dos áudios. */
    set end(value) {
      for(let sample of this.samples) {
        sample.end = value;
      }
  
      this._end = value;
    }

  /**
   * Toca este áudio.
   * 
   * @param {number} index Índice do áudio.
   * 
   * @returns {boolean}
   */
  play(index) {
    if(index < 0 || index >= this.samples.length || this.samples[index] === null || this.samples[index] === undefined) {
      return false;
    }
    
    return this.samples[index].play();
  }

  /**
   * Retrocede este áudio.
   * 
   * @param {number} index Índice do áudio.
   * 
   * @returns {boolean}
   */
  rewind(index) {
    if(index < 0 || index >= this.samples.length || this.samples[index] === null || this.samples[index] === undefined) {
      return false;
    }
    
    return this.samples[index].rewind();
  }

  /**
   * Retrocede todos os áudios.
   * 
   * @returns {boolean}
   */
  rewindAll() {
    for(let sample of this.samples) {
      sample.rewind();
    }

    return true;
  }

  /**
   * Pausa este áudio.
   * 
   * @param {number} index Índice do áudio.
   * 
   * @returns {boolean}
   */
  pause(index) {
    if(index < 0 || index >= this.samples.length || this.samples[index] === null || this.samples[index] === undefined) {
      return false;
    }

    return this.samples[index].pause();
  }

  /**
   * Pausa todos os áudios.
   * 
   * @returns {boolean}
   */
  pauseAll() {
    for(let sample of this.samples) {
      sample.pause();
    }

    return true;
  }

  /**
   * Pausa e reseta este áudio de volta para a posição de origem.
   * 
   * @param {number} index Índice do áudio.
   * 
   * @returns {boolean}
   */
  reset(index) {
    if(index < 0 || index >= this.samples.length || this.samples[index] === null || this.samples[index] === undefined) {
      return false;
    }

    return this.samples[index].reset();
  }

  /**
   * Pausa e reseta todos os áudio de volta para suas posições de origem.
   * 
   * @returns {boolean}
   */
  resetAll() {
    for(let sample of this.samples) {
      sample.reset();
    }

    return true;
  }
}

/**
 * Gera e retorna um pacote de áudio padrão.
 * 
 * @returns {SamplePack[]}
 */
function generateDefaultPack() {
  return [
    new SamplePack("a", 64, null, 1.0),
    new SamplePack("b", 64, null, 1.0),
    new SamplePack("c", 64, null, 1.0),
    new SamplePack("d", 64, null, 1.0),
    new SamplePack("e", 64, null, 1.0),
    new SamplePack("f", 64, null, 1.0),
  ];
}

/** Estados do botão. */
const ButtonState = {
  /** Botão inativo. */
  IDLE: 0,

  /** Botão pressionado. */
  PRESSED: 1,

  /** Botão segurado. */
  HELD: 2,

  /** Botão solto. */
  RELEASED: 3
}

/**
 * @class Button
 * 
 * Representa um dos botões do teclado.
 */
class Button {
  /**
   * @constructor
   * 
   * @param {string} name Nome do botão.
   * @param {string} meta Metadados do botão.
   */
  constructor(name, meta = "") {
    /** Nome do botão. */
    this._name = name.toLocaleLowerCase();

    /** Metadados do botão. */
    this.meta = meta;

    /** Estado do botão. */
    this.state = ButtonState.IDLE;

    /** Indica se foi pressionado na página. */
    this.isDown = false;
  }

  /** Nome do botão. */
  get name() {
    return this._name.toLowerCase();
  }

  /** Nome do botão. */
  set name(value) {
    this._name = name.toLowerCase();
  }

  /** Indica se está inativo. */
	get isIdle() {
		return this.state === ButtonState.IDLE;
	}

	/** Indica se está pressionado. */
	get isPressed() {
		return this.state === ButtonState.PRESSED;
	}

	/** Indica se está segurado. */
	get isHeld() {
		return this.state === ButtonState.HELD;
	}

	/** Indica se está solto. */
	get isReleased() {
		return this.state === ButtonState.RELEASED;
	}

  /**
	 * @event update
	 * Evento que deverá ser executado a cada quadro.
	 */
	update() {
		// Alteração de estado do botão, quando pressionado...
		if(this.isDown === true) {
			if(this.state === ButtonState.PRESSED || this.state === ButtonState.HELD) {
				this.state = ButtonState.HELD;
			}
			else {
				this.state = ButtonState.PRESSED;
			}
		}
		// Alteração de estado do botão, quando solto...
		else {
			if(this.state === ButtonState.PRESSED || this.state === ButtonState.HELD) {
				this.state = ButtonState.RELEASED;
			}
			else {
				this.state = ButtonState.IDLE;
			}
		}
	}
}

/**
 * Popula uma lista de botões a partir de um charset.
 * 
 * @param {string} charset Charset.
 * @param {string} meta Metadados.
 * 
 * @returns {Object<string, Button>} 
 */
function setupKeyboard(charset, meta = "") {
  // Array de caracteres + botões a serem retornados.
  const characters = charset.split("");
  const buttons = {};

  // Instanciar botões...
  for(let character of characters) {
    const button = new Button(character, meta);
    buttons[button.name] = button;
  }

  return buttons;
}

/**
 * Processa eventos de tecla.
 * 
 * @param {KeyboardEvent} e Evento.
 * @param {boolean} isDown Valor que alterna entre pressionar ou não.
 */
function handleKeyEvents(e, isDown) {
  // Nome da tecla pressionada.
	const key = e.key.toLowerCase();

	// Procurar tecla para mudança de estado...
	for(let button of Object.values(Keyboard)) {
		if(button.name === key) {
			button.isDown = isDown;
			break;
		}
	}
}

/** Lista de botões do teclado. */
const Keyboard = setupKeyboard("ZSXDCVGBHNJM,L.;Q2W3E4RT6Y7UI9O0P-[]", "play");

/** O botão *backspace* é usado para limpar uma última nota. */
Keyboard.backspace = new Button("Backspace", "erase");

/** O botão *shift* é usado para trocar de oitavas. */
Keyboard.shift = new Button("shift", "octave");

Keyboard.spacebar = new Button(" ", "auto");


/**
 * @event onkeydown
 * Evento ao pressionar uma tecla.
 * 
 * @param {KeyboardEvent} e Evento.
 */
addEventListener("keydown", (e) => {
  handleKeyEvents(e, true);
});

/**
 * @event onkeydown
 * Evento ao pressionar uma tecla.
 * 
 * @param {KeyboardEvent} e Evento.
 */
addEventListener("keyup", (e) => {
	handleKeyEvents(e, false);
});

/**
 * @class WebTrack@extends Track
 * 
 * @description
 * Driver de áudio do WASM-4 adaptado para funcionar dinamicamente
 * nesta página. De forma resumida, é uma "simulação" da APU do WASM-4.
 */
class WebTrack extends Track {
  /**
   * @constructor
   */
  constructor() {
    // Superclasse...
    super(0);

    /** Pacotes de áudio usados pela trilha. */
    this.packs = generateDefaultPack();

    // Por padrão, esta trilha começa sempre desatiavada...
    this.sentHalt = true;
  }

  /** Pacote de áudio em uso (ver `note`). */
  get pack() {
    return this.packs[this.instrument % this.packs.length];
  }
  
  /**
   * Reinicia a execução, incluindo os rótulos, o bytecode e até esta trilha.
   */
  restart() {
    this.reset();
    this.sentHalt = true;
    this.cursor = 0;
    bytecode.length = 0;
    label = {};
  }

  /**
   * @event onPlay
   * Evento acionado ao tocar uma nota.
   * 
   * @param {u8} note Nota.
   */
  onPlay(note) {
    this.pack.play(note);
  }
}

/** Trilha principal usada pela página. */
const track = new WebTrack();

/** Objeto usado como referência para salvar variáveis para a composição. */
let label = {};

/** Função de carregamento. É sobrescrita via `eval()` pela composição. */
let load = () => {};

/** Contador de taxa de quadros para o loop principal da página. */
const framerate = {
  /** Número de ticks por loop. */
  ticks: 1,

  /** Contador interno. */
  counter: 0
};

/**
 * Exporta o bytecode da trilha, formatado e com *syntax highlightning*.
 */
function highlightExport() {
  // Bytes formatados para exibição.
  let bytes = "";

  // Percorrer e formatar os bytes para exibição...
  for(let index = 0; index < bytecode.length; index += 1) {
    const comma = index > 0? ",": "";
    const byte = `0x${bytecode[index].toString(16).padStart(2, "0")}`;
    
    bytes += `${comma}${byte}`;
  }

  // Formatar código com *syntax highlightning* e exibí-lo na página...
  const sourceCode = Prism.highlight(`// Generated music code. Click on "Export to clipboard" to copy it.\nconst music: usize = memory.data<u8>([ ${bytes} ]);`, Prism.languages.typescript, "typescript");
  Element.exportCode.innerHTML = sourceCode;
}

/**
 * Exporta o código da trilha, interpretando as funções escritas e
 * convertendo-as em bytecode.
 */
function exportCode() {
  // Código-fonte.
  const sourceCode = codeEditor.getValue();
  
  // Resetar bytecode:
  bytecode.length = 0;

  // O "assembly" nada mais é do que uma série de funções escritas
  // em JavaScript. Esta deverá ser executada através do comando `eval()`...
  try {
    eval(`load = () => {${sourceCode};halt();};`);
    load();
    highlightExport();
  }

  // Exibir o erro na área de exportação, caso algo dê errado...
  catch(e) {
    const sourceCode = Prism.highlight(`/*\n\n${e}\n\n*/`, Prism.languages.typescript, "typescript");
    Element.exportCode.innerHTML = sourceCode;
  }
  
}

/**
 * Executa o código.
 */
function run() {
  track.restart();
  track.sentHalt = false;
  exportCode();
}

/**
 * Para a execução do código.
 */
function stop() {
  track.restart();
}

/**
 * Navega para outra aba.
 * 
 * @param {HTMLLiElement} e Elemento representativo da aba.
 */
function setActiveTab(e) {
  // Elementos de aba.
  const tabs = Element.mainTab.querySelectorAll("[data-tab]");

  // Percorrer e localizar cada elemento...
  for(let tab of tabs) {
    const content = document.querySelector(tab.dataset.tab);

    // Marcar a si próprio como ativo...
    if(tab === e) {
      tab.classList.add("is-active");
      content.classList.remove("is-hidden");
    }

    // ...e ocultar o resto:
    else {
      tab.classList.remove("is-active");
      content.classList.add("is-hidden");
    }
  }

  // Re-exportar código...
  exportCode();
}

/** Última nota tocada pelo teclado. Seu valor inicial é nulo, mas muda para um número após a primeira tecla ser pressionada. */
let keyboardLastNote = null;

/** Indica se os controles instrumentais do teclado estão ativados. */
let keyboardControlsEnabled = false;

/** Indica se a inserção automática do teclado instrumental está ativada. */
let keyboardAutoInsertEnabled = false;

/** Indica se a inserção automática dos comandos `wait()` e `wait16()` para o teclado instrumental está ativada. */
let keyboardWaitInsertEnabled = false;

/** Índice do instrumento do teclado instrumental. */
let keyboardInstrument = parseInt(localStorage.getItem("instrument") || 0);

// Não permitir NaN como instrumento...
if(isNaN(keyboardInstrument)) {
  keyboardInstrument = 0;
}

/** Índice da oitava do teclado instrumental. */
let keyboardOctave = parseInt(localStorage.getItem("octave") || 0);

// Não permitir NaN como oitava...
if(isNaN(keyboardOctave)) {
  keyboardOctave = 0;
}

/** Ticks do teclado desde o último botão pressionado. */
let keyboardWaitTicks = 0;

/** Delay de ticks do teclado. */
let keyboardWaitDelay = 2;

/** Contador interno para os ticks do teclado. */
let keyboardWaitCounter = 0;

/**
 * Reseta a contagem de ticks do teclado para inserção automática dos
 * comandos `wait()` e `wait16()`.
 */
function resetWaitTicks() {
  keyboardWaitTicks = 0;
  keyboardWaitCounter = keyboardWaitDelay;
}

/**
 * Adiciona um comando `wait()` ou `wait16()` automaticamente.
 */
function addWaitTicks() {
  // Usar `wait()` para valores menores...
  if(keyboardWaitTicks < 256) {
    codeEditor.setValue(`${codeEditor.getValue()}\nwait(${keyboardWaitTicks})`);
    scrollToLastLine();
  }
  // ...e `wait16()` para valores maiores...
  else {
    codeEditor.setValue(`${codeEditor.getValue()}\nwait16(${keyboardWaitTicks})`);
    scrollToLastLine();
  }

  // Resetar ticks após inserir os valores:
  resetWaitTicks();
}

/**
 * Controla os ticks do teclado para inserção automática dos 
 * comandos `wait()` e `wait16()`.
 */
function handleWaitTicks() {
  if(keyboardWaitCounter > 0) {
    keyboardWaitCounter -= 1;
  }
  else {
    keyboardWaitCounter = keyboardWaitDelay;
    keyboardWaitTicks = (keyboardWaitTicks + 1) % 65535;
  }
}

// Carregar valor do instrumento selecionado...
Element.keyboardInstrument.value = keyboardInstrument;

// Carregar valor da oitava selecionada...
Element.keyboardOctave.value = keyboardOctave;

/**
 * Alterna o estado de um botão para ativado ou desativado.
 * 
 * @param {HTMLButtonElement} e Elemento de botão.
 * @param {boolean} value Valor de referência.
 * @param {{on: string, off: string}} text Texto alternativo (opcional).
 */
function handleSwitchButton(e, value, text = null) {
  // Marcar botão quando ativado...
  if(value === true) {
    e.classList.remove("is-outlined");
    e.classList.add("is-primary");

    if(text != null && text.hasOwnProperty("on")) {
      e.textContent = text.on;
    }
  }
  // ...e desmarcar quando desativado:
  else {
    e.classList.remove("is-primary");
    e.classList.add("is-outlined");

    if(text != null && text.hasOwnProperty("off")) {
      e.textContent = text.off;
    }
  }
}

/**
 * Ativa ou desativa os controles instrumentais do teclado.
 * 
 * @param {HTMLButtonElement} e Elemento representativo do botão.
 */
function toggleKeyboardControls(e) {
  // Alternar valor:
  keyboardControlsEnabled = !keyboardControlsEnabled;
  codeEditor.setOption("readOnly", keyboardControlsEnabled);

  // Atualizar estado do botão e salvar valor:
  handleSwitchButton(e, keyboardControlsEnabled);
  localStorage.setItem("keyboard", keyboardControlsEnabled.toString());
}

/**
 * Ativa ou desativa a inserção automática de notas do teclado.
 * 
 * @param {HTMLButtonElement} e Elemento representativo do botão.
 */
function toggleKeyboardAutoInsert(e) {
  // Alternar valor:
  keyboardAutoInsertEnabled = !keyboardAutoInsertEnabled;

  // Atualizar estado do botão e salvar valor:
  handleSwitchButton(e, keyboardAutoInsertEnabled);
}

/**
 * Ativa ou desativa a inserção automática dos comandos `wait()` e `wait16()` após as notas do teclado.
 * 
 * @param {HTMLButtonElement} e Elemento representativo do botão.
 */
 function toggleKeyboardWaitInsert(e) {
  // Alternar valor:
  keyboardWaitInsertEnabled = !keyboardWaitInsertEnabled;
  keyboardWaitTicks = 0;

  // Atualizar estado do botão e salvar valor:
  handleSwitchButton(e, keyboardWaitInsertEnabled);
}

// Carregar controles do teclado...
if(localStorage.getItem("keyboard") === "true") {
  toggleKeyboardControls(Element.keyboardSwitch);
}

/**
 * Alterna os instrumentos do teclado.
 * 
 * @param {HTMLSelectElement} e Referência do elemento.
 */
function toggleKeyboardInstrument(e) {
  // Índice do instrumento:
  keyboardInstrument = parseInt(e.options[e.selectedIndex].value);

  // Fallback para quando o instrumento não existir...
  if(isNaN(keyboardInstrument)) {
    console.error(`Received NaN on keyboardInstrument = "${e.options[e.selectedIndex].value}".`);
    keyboardInstrument = 0;
  }

  // Salvar escolha:
  localStorage.setItem("instrument", keyboardInstrument);
}

/**
 * Alterna as oitavas do teclado.
 * 
 * @param {HTMLSelectElement} e Referência do elemento.
 */
 function toggleKeyboardOctave(e) {
  // Índice da oitava:
  keyboardOctave = parseInt(e.options[e.selectedIndex].value);

  // Fallback para quando a oitava não existir...
  if(isNaN(keyboardOctave)) {
    console.error(`Received NaN on keyboardOctave = "${e.options[e.selectedIndex].value}".`);
    keyboardOctave = 0;
  }

  // Salvar escolha:
  localStorage.setItem("octave", keyboardOctave);
}

/**
 * Controla os eventos do teclado musical.
 */
function handleMusicalKeyboard() {
  // Botões do teclado.
  const buttons = Object.values(Keyboard);

  // Percorrer botões...
  for(let index = 0; index < buttons.length; index += 1) {
    const button = buttons[index];
          button.update();

    
    if(button.isPressed) {

      // Tocar uma nota...
      if(button.meta === "play") {
        const instrument = keyboardInstrument % track.packs.length;
        const octave = 32 * keyboardOctave;
        const note = octave + index;

        // Tocar e salvar nota recente:
        track.packs[instrument].play(octave + index);
        keyboardLastNote = note;

        // Inserir automaticamente no código, caso ativado:
        if(keyboardAutoInsertEnabled) {
          codeEditor.setValue(`${codeEditor.getValue()}\ndb(${note})`);
          scrollToLastLine();

          // Inserir tempo de espera automaticamente, caso ativado:
          if(keyboardWaitInsertEnabled) {
            addWaitTicks();
          }
        }
      }
      // Inserir oitavas...
      else if(button.meta === "octave") {
        keyboardOctave = (keyboardOctave + 1) % 2;
        Element.keyboardOctave.value = keyboardOctave;
      }
      // Apagar uma nota...
      else if(keyboardAutoInsertEnabled === true) {
        if(button.meta === "erase") {
          const sourceCode = codeEditor.getValue();
          codeEditor.setValue(sourceCode.substring(0, sourceCode.lastIndexOf("\n")));
          scrollToLastLine();
        }
      }
    }
  }

  // Inserir um comando `wait()` ou `wait16()` manualmente...
  if(Keyboard.spacebar.isReleased === true) {
    addWaitTicks();
  }
}

/** Timer de notificação para o botão de área de transferência. */
let clipboardNotifyTimer = 60;

/** Contador interno para a notificação da área de transferência. */
let clipboardNotifyCounter = 0;

/**
 * Copia o código exportado para a área de transferência.
 * 
 * @param {HTMLButtonElement} e Elemento de referência.
 */
function copyToClipboard(e) {
  // Re-exportar código...
  exportCode();

  // Copiar código exportado para a área de transferência:
  navigator.clipboard.writeText(Element.exportCode.textContent);

  // Iniciar timer de notificação e retirar foco sob o elemento...
  clipboardNotifyCounter = clipboardNotifyTimer;
  e.blur();
}

/**
 * @event loop
 */
function loop() {
  // Controlar teclado...
  if(keyboardControlsEnabled === true) {
    handleMusicalKeyboard();
  }

  // Controlar ticks para inserção automática do `wait()` e `wait16()`...
  if(keyboardControlsEnabled === true && (keyboardWaitInsertEnabled === true || Keyboard.spacebar.isHeld === true)) {
    handleWaitTicks();
    Element.keyboardWaitTimer.classList.remove("is-outlined");
    Element.keyboardWaitTimer.classList.add("is-info");
  }
  else {
    Element.keyboardWaitTimer.classList.remove("is-info");
    Element.keyboardWaitTimer.classList.add("is-outlined");
  }

  // Controlar taxa de quadros...
  if(framerate.counter > 0) {
    framerate.counter -= 1;
  }
  else {
    framerate.counter = framerate.ticks;

    // Executar tracker:
    if(track.sentHalt === false) {
      track.update();
    }
  }

  // Exibir última nota tocada...
  if(keyboardLastNote != null) {
    const lastNoteDecimal = keyboardLastNote.toString().padStart(2, "0");
    const lastNoteHex     = keyboardLastNote.toString(16).padStart(2, "0").toUpperCase();
    Element.keyboardLastNote.textContent = `Note ${lastNoteDecimal} / 0x${lastNoteHex}`;
  }

  // Exibir tick de espera atual para inserir o `wait()` ou `wait16()`...
  const waitDecimal = keyboardWaitTicks.toString(16).padStart(4, "0").toUpperCase();  
  Element.keyboardWaitTimer.textContent = `WAIT ${waitDecimal}`;

  if(clipboardNotifyCounter > 0) {
    Element.clipboardButton.classList.remove("is-outlined", "is-info");
    Element.clipboardButton.classList.add("is-warning");
    Element.clipboardButton.textContent = Element.clipboardButton.dataset.successMessage;

    clipboardNotifyCounter -= 1;
  }
  else {
    Element.clipboardButton.classList.remove("is-warning");
    Element.clipboardButton.classList.add("is-outlined", "is-info");
    Element.clipboardButton.textContent = Element.clipboardButton.dataset.defaultMessage;
  }

  // Repetir:
  requestAnimationFrame(loop);
}

// Iniciar loop...
loop();
