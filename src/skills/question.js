'use strict';

const qnaController = require( '../qnaController' );
// Connection Strings to MongoDB Instance


module.exports = function ( controller ) {
    controller.hears( [ '/a', '^\s*?answer' ], 'direct_message,direct_mention', function ( bot, message ) {
        // console.log( 'Answer Received: ' );
        // console.log( message );
        qnaController.handleAnswer( message ).then( response => {
            console.log( 'Handled Answer' );
            let questioner = response.personId;
            let question;
            let answer;
            var answerMessage = `Hello <@personEmail:${response.personEmail}>! `;
            answerMessage += `Your question has been responded to by: <@personEmail:${response.answers[response.answers.length-1].personEmail}>. <br>`;
            if ( response.html ) {
                question = response.html
                answerMessage += `Original Question: ${question}<br>`;
            } else {
                question = response.text
                answerMessage += `Original Question: __${question}__ <br>`;
            }
            if ( response.answers[ response.answers.length - 1 ].html ) {
                answer = response.answers[ response.answers.length - 1 ].html;
                answerMessage += `Answer: ${answer}`;
            } else {
                answer = response.answers[ response.answers.length - 1 ].text
                answerMessage += `Answer: **${answer}**. `;
            }
            bot.startPrivateConversationWithPersonId( questioner, ( error, convo ) => {
                if ( error )
                    console.error( error );
                convo.say( {
                    text: answerMessage,
                    markdown: answerMessage
                } );
            } );
            var mdMessage = `Ok <@personEmail:${message.user}> `;
            mdMessage += `your has answer been logged.`;
            console.log( 'Received Answer' );
            bot.reply( message, {
                markdown: mdMessage
            } );
        } ).catch( err => {
            console.error( err );
            bot.reply( message, {
                markdown: 'Sorry there was an error processing your answer. '
            } );
        } );
    } );
    controller.hears( [ '^\s*?list' ], 'direct_message,direct_mention', function ( bot, message ) {
        let link = process.env.public_address + '/public/#/space/' + message.channel;
        let mdLink = `[here](${link})`;
        let mdMessage = `<@personEmail:${message.user}> Please click ${mdLink} to view this rooms FAQ. `;
        bot.reply( message, {
            markdown: mdMessage
        } );
    } );
    controller.hears( [ '^\s*?open' ], 'direct_message,direct_mention', function ( bot, message ) {
        qnaController.listQuestions( message.channel, 'unanswered' ).then( response => {
            let mdMessage;
            let link = process.env.public_address + '/public/#/space/' + message.channel;
            let mdLink = `[more](${link})`;
            if ( response.docs.length > 0 ) {
                mdMessage = `<@personEmail:${message.user}> Here are the last 10 unanswered questions: <br>`;
                response.docs.forEach( ( doc, index ) => {
                    mdMessage += `Question **${doc.sequence}**: _${doc.text}_ by ${doc.displayName}.<br>`;
                    if ( index == 9 ) {
                        mdMessage += `Click for ${mdLink}. `
                    }
                } );
            } else {
                mdMessage = 'There are no unanswered questions in this Spark Space.';
            }
            bot.reply( message, {
                markdown: mdMessage
            } );
        } )
    } );
    controller.hears( '^(.*)', 'direct_message,direct_mention', function ( bot, message ) {
        var mdMessage = `Ok <@personEmail:${message.user}> `;
        if ( message.original_message.html ) {
            mdMessage += `your question: ` + `${ message.original_message.html.substring(3,message.original_message.html.length-4) }`;
        } else {
            mdMessage += `your question: ` + `__${ message.text }__`;
        }
        qnaController.handleQuestion( message ).then( room => {
                if ( room ) {
                    mdMessage += ' Has been logged as #: ' + `**${room.sequence}**`;
                    mdMessage += `<br>To answer this question please reply with: answer or <code>/a ${room.sequence} [your response].</code> `;
                    bot.reply( message, {
                        markdown: mdMessage
                    } );
                    console.log( 'Handled question successfully. ' );
                } else {
                    let errorMsg = 'Sorry there was an error processing your request.';
                    bot.reply( message, {
                        markdown: errorMsg
                    } );
                }
            } )
            .catch( err => {
                console.error( err );
                let errorMsg = 'Sorry there was an error processing your request. ';
                bot.reply( message, {
                    markdown: errorMsg
                } );
            } );
    } );
};
