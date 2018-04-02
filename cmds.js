
const {models} = require('./model');
const   Sequelize = require ('sequelize');

const {log, biglog, errorlog, colorize} = require("./out");

/**
 * Muestra la ayuda.
 *
 * @param rl Objeto readline usado para implementar el CLI
 */

exports.helpCmd = (socket, rl) => {
    log(socket, "Comandos:");
    log(socket, "  h|help - Muestra esta ayuda.");
    log(socket, "  list - Listar los quizzes existentes.");
    log(socket, "  show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log(socket, "  add - Añadir un nuevo quiz interactivamente.");
    log(socket, "  delete <id> - Borrar ek quiz indicado.");
    log(socket, "  edit <id> - Editar el quiz indicado.");
    log(socket, "  test <id> - Probar el quiz indicado.");
    log(socket, "  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket, "  credits - Créditos.");
    log(socket, "  q|quit - Salir del programa.");
    rl.prompt();
};

/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar el CLI
 */

exports.quitCmd = (socket, rl) => {
    rl.close();
    socket.end
    rl.prompt();
};


/**
 * Esta función convierte la llamada rl.question, que está basada en callbacks en una
 * basada en promesas.
 *
 * Esta función devuelve una promesa que cuando se cumple, proporciona el texto introducido.
 * Entonces la llamda a then que hay que hacer la promesa devuelta será:
 * 		.then(answer => {...})
 *
 * 	Tambiém colorea en rojo el texto de la pregunta, elimina espacios al principio y final
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param text Pregunta que hay que hacerle al usuario.
 */

const makeQuestion = (rl, text) => {

    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve (answer.trim());
        });
    });
};

/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la función rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en el callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI
 */

exports.addCmd = (socket, rl) => {
    makeQuestion(rl, ' Introduzca una pregunta: ')
        .then(q => {
        return makeQuestion(rl, ' Introduzca la respuesta ')
            .then(a => {
            return { question: q, answer: a };
});
})
.then(quiz => {
        return models.quiz.create(quiz);
})
.then((quiz) => {
        log(socket, ` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
})
.catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
    error.errors.forEach(({ message }) => errorlog(message));
})
.catch(error => {
        errorlog(socket, error.message);
})
.then(() => {
        rl.prompt();
});
};


/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI
 */

exports.listCmd = (socket, rl) => {

    models.quiz.findAll()
        .each(quiz => {
        log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
})
.catch(error => {
        errorlog(socket, error.message);
})
.then(() => {
        rl.prompt();
})
};

/**
 * Esta funcion devuleve una promesa que:
 *  -Valida que se ha introducido un valor para el parametro
 *  -Convierte el parametro en un numero entero
 * Si va bien, la promesa se satisface y devuelve el valor de id a usar
 *
 * @param id Parametro con el indice a validar
 *
 */


const validateId = id => {

    return new Sequelize.Promise((resolve, reject) => {
        if (typeof  id === "undefined") {
            reject (new Error (`Falta el parámetro <id>.` ));
        } else {
            id = parseInt(id);
            if (Number.isNaN(id)) {
                reject (new Error(`El valor del parámetro <id> no es un número`));
            } else {
                resolve (id);
            }
        }
    });
};

/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta
 *
 * @param rl Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a mostrar
 */


exports.showCmd = (socket, rl, id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz => {
        if (!quiz) {
        throw new Error(`No existe un quiz asociado al id=${id}.`);
    }
    log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
})
.catch(error => {
        errorlog(socket, error.message);
})
.then(() => {
        rl.prompt();
})
};


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * Hay que recordar que el funcionamiento de la función rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en el callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a probar.
 */

exports.testCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz => {
        if (!quiz) { throw new Error(`No existe un quiz asociado al id=${id}.`); }
    rl.question(colorize(`${quiz.question}` + '? ', 'red'), answer => {
        const resp = answer.toLowerCase().trim();
    const respBuena = quiz.answer.toLowerCase().trim();
    if (resp === respBuena) {
        log(socket, 'Su repuesta es correcta. ');
        biglog(socket, 'CORRECTA', 'green');
        rl.prompt();
    }
    else {
        log(socket, 'Su respuesta es incorrecta. ');
        biglog(socket, 'INCORRECTA', 'red');
        rl.prompt();
    };
    rl.prompt();
});
})

.catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
    error.errors.forEach(({ message }) => errorlog(message));
})
.catch(error => {
        errorlog(socket, error.message);
})
.then(() => {
        rl.prompt();
});

};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente
 *
 * @param rl Objeto readline usado para implementar el CLI
 */

exports.playCmd = (socket, rl) => {
    let score = 0;
    let toBeResolved = [];
    let todasPreguntas = [];
    models.quiz.findAll()
        .each(result => {
        todasPreguntas.push(result);
})
.then(() => {

        for (let i = 0; i < todasPreguntas.length; i++) {

        toBeResolved.push(i);
    }


    const playOne = () => {


        if (toBeResolved.length === 0) {
            log(socket, ' Ya ha respondido a todas las preguntas ', 'green');
            log(socket, ' Fin del examen. Aciertos:')
            biglog(socket, `${score}`, "magenta");
            rl.prompt();

        } else {

            let idAzar = Math.floor(Math.random() * (toBeResolved.length));
            const pregunta = todasPreguntas[toBeResolved[idAzar]];
            toBeResolved.splice(idAzar, 1);
            rl.question(colorize(`${pregunta.question}` + '? ', 'red'), answer => {

                if (answer.trim().toLowerCase() === pregunta.answer.toLowerCase()) {
                score = score + 1;
                log(socket, ` ${colorize('CORRECTO', 'green')} - Lleva ${colorize(score, 'green')} aciertos`);
                playOne();

            } else {
                log(socket, ' INCORRECTO', 'red');
                log(socket, ' Fin del examen. Aciertos:')
                biglog(socket, `${score}`, "magenta");
                rl.prompt();
            }
        });
        }
    }
    playOne();

})
.catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
    error.errors.forEach(({ message }) => errorlog(socket, message));
})
.catch(error => {
        errorlog(socket, error.message);
})
.then(() => {
        rl.prompt();
});
};

/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a borrar en el modelo.
 */

exports.deleteCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.destroy({ where: { id } }))
.catch(error => {
        errorlog(socket, error.message);
})
.then(() => {
        rl.prompt();
});
};


/**
 * Edita un quiz del modelo.
 *
 * Hay que recordar que el funcionamiento de la función rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en el callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a editar en el modelo.
 */

exports.editCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz => {
        if (!quiz) {
        throw new Error(`No existe un quiz asociado al id=${id}.`);
    }

    process.stdout.isTTY && setTimeout(() => { rl.write(quiz.question) }, 0);
    return makeQuestion(rl, ' Introduzca la pregunta: ')
        .then(q => {
        process.stdout.isTTY && setTimeout(() => { rl.write(quiz.answer) }, 0);
    return makeQuestion(rl, ' Introduzca la respuesta ')
        .then(a => {
        quiz.question = q;
    quiz.answer = a;
    return quiz;
});
});
})
.then(quiz => {
        return quiz.save();
})
.then(quiz => {
        log(socket, ` Se ha cambiado el quiz ${colorize(id, 'magenta')} por : ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
})
.catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
    error.errors.forEach(({ message }) => errorlog(message));
})
.catch(error => {
        errorlog(socket, error.message);
})
.then(() => {
        rl.prompt();
});
};

/**
 * Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI
 */

exports.creditsCmd = (socket, rl) => {
    log(socket, 'Autores de la práctica:');
    log(socket, 'FRANCISCO LORENZO GOMEZ', 'green');
    rl.prompt();
};