
const model = require('./model')

const {log, biglog, errorlog, colorize} = require("./out");

exports.helpCmd = rl => {
    log ("Commandos:");
    log ("  h|help - Muestra esta ayuda.");
    log ("  list - Listar los quizzes existentes.");
    log ("  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log ("  add - Añadir un nuevo quiz interactivamente.");
    log ("  delete <id> - Borrar el quiz indicado.");
    log ("  edit <id> - Editar el quiz indicado.");
    log ("  test <id> - Probar el quiz indicado.");
    log ("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log ("  credits - Créditos.");
    log ("  q|quit - Salir del programa.");
    rl.prompt();
};

exports.quitCmd = rl => {
    rl.close();
};

exports.addCmd = rl => {

    rl.question(colorize(' Introduzca una pregunta: ', 'red'), question =>{

        rl.question(colorize(' Introduzca la respuesta ', 'red'), answer =>{

            model.add(question, answer);
            log(`${colorize ('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta' )} ${answer}`);
            rl.prompt();
        });
    });
};

exports.listCmd = rl => {

    model.getAll().forEach((quiz,id) => {

        log(`   [${ colorize (id, 'magenta')}]: ${quiz.question}`  );
    });
    rl.prompt();
}

exports.showCmd = (id, rl) => {

    if (typeof  id === "undefined") {
        errorlog (`Falta el parámetro id.` );
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(`  [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize ('=>', 'magenta')} ${quiz.answer}`);
        } catch (error) {
            errorlog (error.message);
        }
    }

    rl.prompt();

}

exports.testCmd = (id, rl) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);
            rl.question(colorize(`${quiz.question}? `, 'red'), answer => {

                if (answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
                    log('Su repuesta es correcta. ');
                    biglog('CORRECTA', 'green');
                    rl.prompt();
                }
                else {
                    log('Su respuesta es incorrecta. ');
                    biglog('INCORRECTA', 'red');
                    rl.prompt();
                };
                rl.prompt();
            });

        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};

exports.playCmd = (rl) => {
    let score = 0;
    let toBeResolved = [];
    const quizzes = model.getAll();
    for (let i = 0; i < quizzes.length; i++) {
        toBeResolved.push(i);
    }
    const playOne = () => {

        if (toBeResolved.length === 0) {
            log(' Ya ha respondido a todas las preguntas ', 'green');
            console.log(' Fin del examen. Aciertos:')
            biglog(`${score}`, "magenta");
            rl.prompt();

        } else {

            let id = Math.floor(Math.random() * (toBeResolved.length));

            const quiz = quizzes[toBeResolved[id]];
            toBeResolved.splice(id, 1);

            rl.question(`${colorize(quiz.question + '?', 'cyan')}   `, answer => {

                if (answer.trim().toLowerCase() === quiz.answer.toLowerCase()) {
                    score ++;
                    console.log(` ${colorize('CORRECTO', 'green')} - Lleva ${colorize(score, 'green')} aciertos`);
                    playOne();

                } else {
                    log(' INCORRECTO', 'red');
                    console.log(' Fin del examen. Aciertos:')
                    biglog(`${score}`, "magenta");
                    rl.prompt();
                }
            });
        }
    }

    playOne();

};

exports.deleteCmd = (id, rl)  => {

    if (typeof  id === "undefined") {
        errorlog (`Falta el parámetro id.` );
    } else {
        try {
            model.deleteByIndex(id);
        } catch (error) {
            errorlog (error.message);
        }
    }
    rl.prompt();
}

exports.editCmd = (id, rl)  => {

    if (typeof  id === "undefined") {
        errorlog (`Falta el parámetro id.` );
        rl.prompt;
    } else {
        try {

            const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

            rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);

                rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
                    model.update(id, question, answer);
                    log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};

exports.creditsCmd = rl => {
    log('Autores de la práctica:');
    log('Nombre 1', 'green');
    log('Nombre 2', 'green');
    rl.prompt();
}