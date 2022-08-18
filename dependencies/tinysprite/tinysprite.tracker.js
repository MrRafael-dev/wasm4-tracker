/**
 * @name TinySprite Track Script for WASM-4
 * @author Mr.Rafael
 * @license MIT
 * @version 1.0.9
 *
 * @description
 * Funções que ajudam a entender e criar trilhas sonoras para a classe `Track`.
 */

/** Opcodes usados pelas trilhas. */
const Opcode = {
  NOP          : 0x00,
  HALT         : 0xFF,
  JUMP         : 0xFE,
  IFJUMP       : 0xFD,
  IFNOTJUMP    : 0xFC,
  SECTION      : 0xFB,
  REPEAT       : 0xFA,
  IFREPEAT     : 0xF9,
  IFNOTREPEAT  : 0xF8,
  SYSCALL      : 0xF7,
  RESET        : 0xF6,
  SET          : 0xF5,
  ADD          : 0xF4,
  SUB          : 0xF3,
  EQUAL        : 0xF2,
  LT           : 0xF1,
  GT           : 0xF0,
  LTEQUAL      : 0xEF,
  GTEQUAL      : 0xEE,
  TICKS        : 0xED,
  TICKS16      : 0xEC,
  WAIT         : 0xEB,
  WAIT16       : 0xEA,
  INSTRUMENT   : 0xE9,
  INSTRUMENTSET: 0xE8,
  PLAY         : 0xE7,
  PLAYSET      : 0xE6,
};

/** Bytecode resultante. Exporte-o como `memory.data<u8>([ ... ]);` */
const bytecode = [];

/**
 * Representa um valor de 8-bits.
 * 
 * @param {number} value Valor a ser convertido.
 * 
 * @returns {u8}
 */
function u8(value) {
	const u8value = Math.abs(value) % 256;
	return isNaN(u8value)? 0: u8value;
}

/**
 * Separa um valor de 16-bits em uma array com os 2 bytes separados.
 * 
 * @param {u16} value Valor a ser separado.
 * 
 * @returns {u8[]}
 */
function u16hilo(value) {
  const hi = u8((Math.abs(value) % 65536) >> 8);
	const lo = u8((Math.abs(value) % 65536) - hi);

  return [hi, lo];
}

/**
 * Representa um valor de 16-bits.
 * Os valores são convertidos para uma ordem diferente.
 * 
 * Ex: `0xFFAA` se transformará em `0xAAFF`.
 * 
 * @param {number} value Valor a ser convertido.
 * 
 * @returns {u8}
 */
function u16(value) {
	const hi = u8((Math.abs(value) % 65536) >> 8);
	const lo = u8((Math.abs(value) % 65536) - hi);

	return (lo * 0x100) | hi;
}

/**
 * Representa o valor unitário da arquitetura da plataforma.
 * Por conveniência, este valor será o mesmo que um do tipo `u16`.
 * 
 * @param {number} value Valor a ser convertido.
 * 
 * @returns {u16}
 */
function usize(value) {
  return u16(value);
}

/**
 * Implementação da função `memory.load<u8>([])`, do AssemblyScript.
 * 
 * @param {number} offset Offset de memória.
 * 
 * @returns {u8}
 */
function loadu8(offset) {
  return u8(Math.abs(bytecode[offset]) % 256);
}

/**
 * Implementação da função `memory.load<u16>([])`, do AssemblyScript.
 * 
 * @param {number} offset Offset de memória.
 * 
 * @returns {u16}
 */
function loadu16(offset) {
  const lo = u8((Math.abs(bytecode[offset    ])) % 256);
  const hi = u8((Math.abs(bytecode[offset + 1])) % 256);

  return (hi * 0x100) | lo;
}

/**
 * Retorna o total de bytes escritos.
 * 
 * @returns {number}
 */
function len() {
	return bytecode.length;
}

/**
 * Insere uma série de bytes diretamente.
 * 
 * @param  {...u8} Bytes a serem inseridos.
 */
function db(...bytes) {
	for(let byte of bytes) {
		bytecode.push(u8(byte));
	}
}

/**
 * @opcode NOP
 * Operação vazia.
 */
function nop() {
	bytecode.push(Opcode.NOP);
}

/**
 * @opcode HALT @requests sentHalt
 * Solicita o encerramento da execução.
 */
function halt() {
	bytecode.push(Opcode.HALT);
}

/**
 * @opcode JUMP
 * Salta para um outro offset.
 * 
 * @param {u16} value Offset.
 */
function jump(value) {
  const bytes = u16hilo(value);
	bytecode.push(Opcode.JUMP, bytes[1], bytes[0]);
}

/**
 * @opcode IFJUMP
 * Salta para um outro offset, quando o valor do acumulador
 * é igual a `true`.
 * 
 * @param {u16} value Offset.
 */
function ifjump(value) {
  const bytes = u16hilo(value);
	bytecode.push(Opcode.IFJUMP, bytes[1], bytes[0]);
}

/**
 * @opcode IFNOTJUMP
 * Salta para um outro offset, quando o valor do acumulador
 * é igual a `false`.
 * 
 * @param {u16} value Offset.
 */
function ifnotjump(value) {
  const bytes = u16hilo(value);
	bytecode.push(Opcode.IFNOTJUMP, bytes[1], bytes[0]);
}

/**
 * @opcode SECTION
 * Salva um offset para saltar depois.
 */
function section() {
  bytecode.push(Opcode.SECTION);
}

/**
 * @opcode REPEAT
 * Salta para o offset salvo.
 */
function repeat() {
  bytecode.push(Opcode.REPEAT);
}

/**
 * @opcode IFREPEAT
 * Salta para o offset salvo, quando o valor do acumulador
 * é igual a `true`.
 */
function ifrepeat() {
  bytecode.push(Opcode.IFREPEAT);
}

/**
 * @opcode IFNOTREPEAT
 * Salta para o offset salvo, quando o valor do acumulador
 * é igual a `false`.
 */
function ifnotrepeat() {
  bytecode.push(Opcode.IFNOTREPEAT);
}

/**
 * @opcode SYSCALL @requests sentSyscall
 * Solicita uma *syscall* externa.
 * 
 * @param {u16} value Código da *syscall*.
 */
function syscall(value) {
  const bytes = u16hilo(value);
	bytecode.push(Opcode.SYSCALL, bytes[1], bytes[0]);
}

/**
 * @opcode RESET
 * Reseta todos os valores desta trilha de volta aos originais.
 */
function reset() {
	bytecode.push(Opcode.RESET);
}

/**
 * @opcode SET
 * Define um valor para o registrador.
 * 
 * @param {u8} value Valor.
 */
function set(value) {
	bytecode.push(Opcode.SET, u8(value));
}

/**
 * @opcode ADD
 * Adiciona um valor para o registrador.
 * 
 * @param {u8} value Valor.
 */
function add(value) {
	bytecode.push(Opcode.ADD, u8(value));
}

/**
 * @opcode SUB
 * Subtrai um valor do registrador.
 * 
 * @param {u8} value Valor.
 */
function sub(value) {
	bytecode.push(Opcode.SUB, u8(value));
}

/**
 * @opcode EQUAL
 * Compara se o registrador é igual ao valor.
 * 
 * @param {u8} value Valor.
 */
function equal(value) {
	bytecode.push(Opcode.EQUAL, u8(value));
}

/**
 * @opcode LT
 * Compara se o registrador é menor que o valor.
 * 
 * @param {u8} value Valor.
 */
function lt(value) {
	bytecode.push(Opcode.LT, u8(value));
}

/**
 * @opcode GT
 * Compara se o registrador é maior que o valor.
 * 
 * @param {u8} value Valor.
 */
function gt(value) {
	bytecode.push(Opcode.GT, u8(value));
}

/**
 * @opcode LTEQUAL
 * Compara se o registrador é menor ou igual ao valor.
 * 
 * @param {u8} value Valor.
 */
function ltequal(value) {
	bytecode.push(Opcode.LTEQUAL, u8(value));
}

/**
 * @opcode GTEQUAL
 * Compara se o registrador é maior ou igual ao valor.
 * 
 * @param {u8} value Valor.
 */
function gtequal(value) {
	bytecode.push(Opcode.GTEQUAL, u8(value));
}

/**
 * @opcode TICKS
 * Define uma taxa de ticks de execução.
 * 
 * @param {u8} value Taxa de ticks.
 */
function ticks(value) {
	bytecode.push(Opcode.TICKS, u8(value));
}

/**
 * @opcode TICKS
 * Define uma taxa de ticks de execução (16-bits).
 * 
 * @param {u16} value Taxa de ticks.
 */
 function ticks16(value) {
  const bytes = u16hilo(value);
	bytecode.push(Opcode.TICKS16, bytes[1], bytes[0]);
}

/**
 * @opcode WAIT
 * Define um período de espera até a próxima instrução.
 * 
 * @param {u8} value Índice do instrumento.
 */
function wait(value) {
	bytecode.push(Opcode.WAIT, u8(value));
}

/**
 * @opcode WAIT16
 * Define um período de espera até a próxima instrução (16-bits).
 * 
 * @param {u16} value Índice do instrumento.
 */
function wait16(value) {
  const bytes = u16hilo(value);
	bytecode.push(Opcode.WAIT16, bytes[1], bytes[0]);
}

/**
 * @opcode INSTRUMENT @requests sentInstrument
 * Define um índice de instrumento para uso.
 * 
 * @param {u8} value Índice do instrumento.
 */
function instrument(value) {
	bytecode.push(Opcode.INSTRUMENT, u8(value));
}

/**
 * @opcode INSTRUMENTSET @requests sentInstrument
 * Define um índice de instrumento para uso.
 * Utiliza o valor salvo no registrador.
 */
function instrumentset() {
  bytecode.push(Opcode.INSTRUMENTSET);
}

/**
 * @opcode PLAY @requests sentPlay
 * Define um índice de instrumento para uso.
 * 
 * @param {u8} value Índice do instrumento.
 */
function play(value) {
	bytecode.push(Opcode.PLAY, u8(value));
}

/**
 * @opcode PLAYSET @requests sentPlay
 * Define um índice de instrumento para uso.
 * Utiliza o valor salvo no registrador.
 */
function playset(value) {
	bytecode.push(Opcode.PLAYSET, u8(value));
}

/**
 * @class Track
 * 
 * Representa uma trilha sonora, que funciona a partir de uma série de eventos
 * controlados por opcodes.
 */
class Track {
	/**
	 * @constructor
	 * 
	 * @param {usize} data Ponteiro de referência.
	 */
	constructor(data) {
    /** Ponteiro de referência. */
	  this.data = data;

    /** Cursor responsável por coletar as instruções. */
	  this.cursor = u16(0);

    /** Contador interno de ticks. Pode ser controlado com `wait`. */
	  this.counter = u16(0);

	  /** Seção temporária da trilha. Pode ser saltada diretamente. */
	  this.section = u16(0);
    
    /** Registrador único. Usado para operações simples. */
	  this.register = u8(0);

    /** Acumulador único. Salva comparações feitas no registrador. */
	  this.accumulator = false;

    /** Índice do instrumento selecionado. */
	  this.instrument = u8(0);

    /** Nota do instrumento solicitada para tocar. */
	  this.note = u8(0);

    /** Código de *syscall*. Usado para se comunicar externamente. */
	  this.syscode = u16(0);

    /** Atraso de ticks por quadro. */
	  this.ticks = u16(0);

    /** Período de espera. usado para pausar o tempo de execução. */
	  this.wait = u16(0);
    
    /** Indica se foi solicitado o encerramento da execução. */
	  this.sentHalt = false;

    /** Indica se foi solicitada uma *syscall*. */
	  this.sentSyscall = false;

		/** Indica se foi solicitado a troca de instrumento. */
		this.sentInstrument = false;

    /** Indica se foi solicitado o toque da nota. */
	  this.sentPlay = false;
	}

	/**
	 * Reseta todos os valores desta trilha de volta aos originais.
	 */
	reset() {
		this.cursor         = u16(0);
    this.counter        = u16(0);
		this.section        = u16(0);
    this.register       = u8(0);
    this.accumulator    = false;
    this.instrument     = u8(0);
    this.note           = u8(0);
    this.syscode        = u16(0);
    this.ticks          = u16(0);
    this.wait           = u16(0);
    this.sentHalt       = false;
    this.sentSyscall    = false;
		this.sentInstrument = false;
    this.sentPlay       = false;
	}
  
	/**
	 * @event onHalt
	 * Evento acionado ao encerrar a execução.
	 */
	onHalt() {
	}
  
	/**
	 * @event onSyscall
	 * Evento acionado ao receber um código de *syscall*.
	 * 
	 * @param {u16} syscode Código de *syscall*.
	 */
	onSyscall(syscode) {
	}

	/**
   * @event onInstrument
   * Evento acionado ao receber um instrumento para trocar.
   * 
   * @param {u8} instrumento Instrumento a ser trocado.
   */
	onInstrument(instrument) {
  }
  
	/**
	 * @event onPlay
	 * Evento acionado ao receber uma nota para tocar.
	 * 
	 * @param {u8} note Nota a ser tocada.
	 */
	onPlay(note) {
	}
  
	/**
	 * @event update
	 * Evento de *update* para esta trilha sonora.
	 */
	update() {
	  // Não executar quando o encerramento tiver sido solicitado...
	  if(this.sentHalt) {
			this.onHalt();
			return;
	  }
  
	  // Não executar até sincronizar com a taxa de ticks por ciclo...
	  if(this.counter > 0) {
			this.counter -= 1;
			return;
	  }
  
	  // Redefinir taxa de ticks:
	  this.counter = this.ticks;
  
	  // Este valor poderão ser alterados novamente
	  // até o encerramento da função...
	  this.sentSyscall    = false;
		this.sentInstrument = false;
	  this.sentPlay       = false;
  
	  // Não executar enquanto estiver em um período de espera...
	  if(this.wait > 0) {
			this.wait -= 1;
			return;
	  }
  
	  // Executar código (com recursão de até 255 loops)...
	  for(let index = 0; index < 255; index += 1) {
		// Offset e opcode da instrução a ser executada.
		const offset  = this.data + this.cursor;
		const opcode = loadu8(offset);
  
		// Operação vazia.
		if(opcode === Opcode.NOP) {
		  this.cursor += 1;
		  break;
		}
  
		// Solicita o encerramento da execução.
		if(opcode === Opcode.HALT) {
		  this.sentHalt = true;
		  this.cursor += 1;
  
		  this.onHalt();
		  continue;
		}
  
		// Salta para um outro offset.
		if(opcode === Opcode.JUMP) {
		  this.cursor = loadu16(offset + 1);
		  continue;
		}
  
		// Salta para um outro offset, quando o valor do acumulador
		// é igual a `true`.
		if(opcode === Opcode.IFJUMP) {
		  if(this.accumulator === true) {
				this.cursor = loadu16(offset + 1);
				continue;
		  }
				  
		  this.cursor += 2;
		  continue;
		}

		// Salta para um outro offset, quando o valor do acumulador
		// é igual a `false`.
		if(opcode === Opcode.IFNOTJUMP) {
		  if(this.accumulator === false) {
				this.cursor = loadu16(offset + 1);
				continue;
		  }
				  
		  this.cursor += 2;
		  continue;
		}

    // Salva um offset para saltar depois.
		if(opcode === Opcode.SECTION) {
		  this.section = this.cursor;
      this.cursor += 1;
		  continue;
		}

    // Salta para o offset salvo.
		if(opcode === Opcode.REPEAT) {
		  this.cursor = this.section;
		  continue;
		}

    // Salta para o offset salvo, quando o valor do acumulador
    // é igual a `true`.
		if(opcode === Opcode.IFREPEAT) {
		  if(this.accumulator === true) {
				this.cursor = this.section;
				continue;
		  }
				  
		  this.cursor += 1;
		  continue;
		}

    // Salta para o offset salvo, quando o valor do acumulador
    // é igual a `false`.
		if(opcode === Opcode.IFNOTREPEAT) {
		  if(this.accumulator === false) {
				this.cursor = this.section;
				continue;
		  }
				  
		  this.cursor += 1;
		  continue;
		}
  
		// Solicita a execução de uma syscall.
		if(opcode === Opcode.SYSCALL) {
		  this.syscode = loadu16(offset + 1);
		  this.sentSyscall = true;
		  this.cursor += 3;
  
		  this.onSyscall(this.syscode);
		  break;
		}
  
		// Define um valor para o registrador.
		if(opcode === Opcode.SET) {
		  this.register = loadu8(offset + 1);
		  this.cursor += 2;
		  continue;
		}
  
		// Adiciona um valor para o registrador.
		if(opcode === Opcode.ADD) {
		  this.register += loadu8(offset + 1);
		  this.cursor += 2;
		  continue;
		}
  
		// Subtrai um valor do registrador.
		if(opcode === Opcode.SUB) {
		  this.register -= loadu8(offset + 1);
		  this.cursor += 2;
		  continue;
		}
  
		// Compara se o registrador é igual ao valor.
		if(opcode === Opcode.EQUAL) {
		  const value = loadu8(offset + 1);
		  this.accumulator = this.register === value;
		  this.cursor += 2;
		  continue;
		}
  
		// Compara se o registrador é menor que o valor.
		if(opcode === Opcode.LT) {
		  const value = loadu8(offset + 1);
		  this.accumulator = this.register < value;
		  this.cursor += 2;
		  continue;
		}
  
		// Compara se o registrador é maior que o valor.
		if(opcode === Opcode.GT) {
		  const value = loadu8(offset + 1);
		  this.accumulator = this.register > value;
		  this.cursor += 2;
		  continue;
		}
  
		// Compara se o registrador é menor ou igual que o valor.
		if(opcode === Opcode.LTEQUAL) {
		  const value = loadu8(offset + 1);
		  this.accumulator = this.register <= value;
		  this.cursor += 2;
		  continue;
		}
  
		// Compara se o registrador é maior ou igual que o valor.
		if(opcode === Opcode.GTEQUAL) {
		  const value = loadu8(offset + 1);
		  this.accumulator = this.register >= value;
		  this.cursor += 2;
		  continue;
		}
  
		// Define uma taxa de ticks de execução.
		if(opcode === Opcode.TICKS) {
		  this.ticks = loadu8(offset + 1);
		  this.cursor += 2;
		  break;
		}
  
		// Define uma taxa de ticks de execução. (16-bits).
		if(opcode === Opcode.TICKS16) {
		  this.ticks = loadu16(offset + 1);
		  this.cursor += 3;
		  break;
		}
  
		// Define um período de espera até a próxima instrução.
		if(opcode === Opcode.WAIT) {
		  this.wait = loadu8(offset + 1);
		  this.cursor += 2;
		  break;
		}
  
		// Define um período de espera até a próxima instrução (16-bits).
		if(opcode === Opcode.WAIT16) {
		  this.wait = loadu16(offset + 1);
		  this.cursor += 3;
		  break;
		}
		
		// Define um índice de instrumento para uso.
		if(opcode === Opcode.INSTRUMENT) {
		  this.instrument = loadu8(offset + 1);
			this.sentInstrument = true;
		  this.cursor += 2;

			this.onInstrument(this.instrument);
		  break;
		}

    // Define um índice de instrumento para uso.
    // Utiliza o valor salvo no registrador.
		if(opcode === Opcode.INSTRUMENTSET) {
		  this.instrument = this.register;
			this.sentInstrument = true;
		  this.cursor += 1;

			this.onInstrument(this.instrument);
		  break;
		}
  
		// Solicita o toque de uma nota do instrumento.
		if(opcode === Opcode.PLAY) {
		  this.note = loadu8(offset + 1);
		  this.sentPlay = true;
		  this.cursor += 2;
  
		  this.onPlay(this.note);
		  break;
		}

    // Solicita o toque de uma nota do instrumento.
    // Utiliza o valor salvo no registrador.
		if(opcode === Opcode.PLAYSET) {
		  this.note = this.register;
		  this.sentPlay = true;
		  this.cursor += 1;
  
		  this.onPlay(this.note);
		  break;
		}
  
		// Quando um opcode não se associa a uma determinada instrução, ele
		// será considerado uma nota:
		this.note = loadu8(offset);
		this.sentPlay = true;
		this.cursor += 1;
		
		this.onPlay(this.note);
		break;
	  }
	}
}

if(globalThis.hasOwnProperty("module")) {
	/** Exportação de módulos (Node.js). */
	module.exports = {
		Opcode, 
		bytecode, 
		u8, 
		u16,
		len, 
		db, 
		nop, 
		halt, 
		jump, 
		ifjump, 
		ifnotjump, 
    section,
    repeat,
    ifrepeat,
    ifnotrepeat,
		syscall, 
		reset, 
		set, 
		add, 
		sub,
		equal, 
		lt, 
		gt, 
		ltequal, 
		gtequal, 
		ticks, 
		ticks16, 
		wait, 
		wait16, 
		instrument, 
    instrumentset,
		play,
    playset,
    Track
	};
}
