
const {models} = require('./model');
const   Sequelize = require ('sequelize');

const {log, biglog, errorlog, colorize} = require("./out");

/**
 * Muestra la ayuda.
 *
 * @param rl Objeto readline usado para implementar el CLI
 */

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

/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar el CLI
 */

exports.quitCmd = rl => {
    rl.close();
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

exports.addCmd = rl => {
    makeQuestion(rl, ' Introduzca una pregunta: ')
        .then(q => {
            return makeQuestion(rl, ' Introduzca la respuesta ')
                .then(a => {
                    return {question: q, answer: a};
                });
        })
        .then (quiz => {
            return models.quiz.create(quiz);
        })
        .then((quiz) => {
            log(` [${colorize('Se ha añadido', 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog('El quiz es erroneo:');
            error.errors.forEach(({message}) => errorlog(message));
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then (() => {
            rl.prompt();
        });
};

/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI
 */

exports.listCmd = rl => {

    models.quiz.findAll()
        .then (quizzes => {
            quizzes.forEach( quiz => {
                log (`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
            });
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
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


exports.showCmd = (id, rl) => {

    validateId(id)
        .then (id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error (`No existe un quiz asociado al id=${id}.`);
            }
            log (`[${colorize(quiz.id, 'magenta')}]:    ${quiz.question} ${colorize ('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch (error => {
            errorlog(error.message);
        })
        .then (() => {
            rl.prompt();
        });
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

exports.testCmd = (id, rl) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
        .then (quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            return makeQuestion(rl, `${quiz.question}? `)
                .then(a => {
                    if (a.trim().toLowerCase() === quiz.answer.toLowerCase()) {
                        log("Su respuesta es correcta.");
                        biglog('Correcta', 'green');
                    } else {
                        console.log("Su respuesta es incorrecta.");
                        //biglog('Incorrecta', 'red');
                    }

                    rl.prompt();
                });
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog('El quiz es erroneo:');
            error.errors.forEach(({message}) => errorlog(message));
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then (() => {
            rl.prompt();
        });
};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente
 *
 * @param rl Objeto readline usado para implementar el CLI
 */

exports.playCmd = (rl) => {

    let score = 0;
    let toBeResolved = [];
    let preg_resp =[];

    models.quiz.findAll()
        .each(quiz => {
            preg_resp.push(quiz);
        })
        .then (() => {

            for (let i = 0; i < preg_resp.length; i++) {
                toBeResolved.push(i);
            }

            const playOne = () => {

                if (toBeResolved.length === 0) {
                    //log(" No hay nada más que preguntar");
                    console.log(` Fin del juego. Aciertos: ${score}`);
                    //biglog(`${score}`, 'magenta');
                    rl.prompt();
                } else {
                    try{
                        let id = Math.floor(Math.random() * toBeResolved.length); 	// Uso floor ya que la longitud del array es una ud. mayor que el mayor ínice.
                        const quiz = preg_resp[toBeResolved[id]];
                        toBeResolved.splice(id,1);

                        return makeQuestion(rl, `${quiz.question}? `)
                            .then(respuesta =>{
                                if (respuesta.trim().toLowerCase() === quiz.answer.toLowerCase()) {
                                    score = score + 1;
                                    log(` CORRECTO - Lleva ${score} aciertos.`);
                                    playOne();
                                } else {
                                    //console.log(" INCORRECTO");
                                    //console.log(` Fin del juego. Aciertos: ${score}`);
                                    console.log(`Respuesta incorrecta. Fin del examen. Aciertos: ${score}`);
                                    //biglog(`${score}`, 'magenta');
                                    rl.prompt();
                                }
                            });
                    } catch(error) {
                        errorlog(error.message);
                        rl.prompt();
                    }
                }
            };

            playOne()
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog('El quiz es erróneo:');
            error.errors.forEach(({message}) => errorlog(message));
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then (() => {
            rl.prompt();
        });
};

/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a borrar en el modelo.
 */

exports.deleteCmd = (id, rl) => {
    validateId(id)
        .then(id => models.quiz.destroy({where: {id}}))
        .catch(error => {
            errorlog(error.message);
        })
        .then (() => {
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

exports.editCmd = (id, rl) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
        .then (quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
            return makeQuestion(rl, ' Introduzca la pregunta ')
                .then(q => {
                    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
                    return makeQuestion(rl, ' Introduzca la respuesta ')
                        .then(a => {
                            quiz.question =	q;
                            quiz.question =a;
                            return quiz;
                        });
                });
        })
        .then(quiz => {
            return quiz.save();
        })
        .then((quiz) => {
            log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog('El quiz es erroneo:');
            error.errors.forEach(({message}) => errorlog(message));
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then (() => {
            rl.prompt();
        });
};

/**
 * Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI
 */

exports.creditsCmd = rl => {
    log('Autores de la práctica:');
    log('FRANCISCO LORENZO GÓMEZ', 'green');
    log('Nombre 2', 'green');
    rl.prompt();
}