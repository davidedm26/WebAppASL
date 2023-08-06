var main = function (medici) {
    "use strict"; //modalità rigorosa
    
    //Creo la lista delle specializzazioni
    var specialization_list = [];
    medici.forEach(function(med) { //da ogni medico leggo la specializzazione, se non esiste nel mio elenco la aggiungo
        var specialization = med.specializzazione;
        if (!specialization_list.includes(specialization)) {
            specialization_list.push(specialization);
        }
    });

    //per ogni span creo un listener
    $(".tabs a span").toArray().forEach(function (element) {
        var $element = $(element);

        // Lista di date come menu a tendina
        var $date_list = $("<select>").addClass("date_list");
        $date_list.append($("<option>").text("Seleziona una data"));

        var currentDate = new Date(); // Crea la data corrente
        for (var i = 1; i < 30; i++) { //aggiunge le 30 date successive al giorno corrente, esclusi sabato e domenica
            var nextDate = new Date();
            nextDate.setDate(currentDate.getDate() + i);//incrementa la data di 1 
        
            // Escludi i giorni di sabato (6) e domenica (0)
            if (nextDate.getDay() !== 6 && nextDate.getDay() !== 0) {
                //forma la data e appendila alla lista delle opzioni
                var year = nextDate.getFullYear();
                var month = String(nextDate.getMonth() + 1).padStart(2, '0');
                var day = String(nextDate.getDate()).padStart(2, '0');
                var dateString = year + "-" + month + "-" + day;
                $date_list.append($("<option>").text(dateString));
            }
        }


        // Lista di specializzazioni come menu a tendina
        var $specialization_list = $("<select>").addClass("specialization_list");
        $specialization_list.append($("<option>").text("Seleziona una specializzazione"));
        //aggiunge ognuna delle specializzazioni della lista
        specialization_list.forEach( function ( spec ){
            $specialization_list.append($("<option>").text(spec));
        })

        

        //dichiaro menu a tendina medici
        var $med_list = $("<select>").addClass("med_list");
        $med_list.append($("<option>").text("Seleziona un medico"));

        //dichiaro menu a tendina orari
        var $orari_list = $("<select>").addClass("orari_list");
        $orari_list.append($("<option>").text("Seleziona un orario"));

        //dichiaro tasto di conferma prenotazione
        var $confermaButton = $("<button>").text("Conferma prenotazione");
        
        
        //crea listener sul click
        $element.on("click", function () {
            var $content,
                $button,
                pazienteCf
        
            var erroreAppeso = false; // serve per controllare se il messaggio di errore sull'inserimento del codice fiscale è giaà presente, nel caso ci fosse già non lo aggiungo di nuovo
                
            //sequenza vper ognuno degli span clickati
            $(".tabs a span").removeClass("active");//rendi la finestra attiva
            $element.addClass("active"); //aggiungi l'attributo attiva alla classe
            $("main .content").empty();//Svuota il contenuto

            if ($element.parent().is(":nth-child(1)")) { // se ho clickato sul primo tasto

                var $cf_input = $("<input>").addClass("codice_fiscale"); //Crea la casella di inserimento
                var $cf_label = $("<p>").text("Ricerca il paziente per codice fiscale");//crea label
                $button = $("<button>").text("Invia"); //Crea tasto invio

                $content = $("<div>"); //aggiunge gli elementi all'elemento DOM $content(alla fine sarà aggiunto al contenuto principale)
                $content.append($cf_label)
                .append($cf_input)
                .append($button)

                $button.on("click", function(){//listener del tasto invio
                    var _cf = $cf_input.val().toUpperCase(); //legge la stringa inserita e la converte in UpperCase(formato di riferimento nel db)
                    
                    if(_cf != ""){ //controllo che sia stato inserito qualcosa

                        //chiama la rotta GET /paziente/cf
                        $.getJSON("/paziente/cf", {"codice_fiscale": _cf}, function (paziente){   
                            $cf_input.val(""); //azzero valore casella
                            
                            if (paziente.length != 0){//se ho trovato il paziente
                                console.log("Paziente trovato");
                                $content.empty(); //svuoto vista

                                pazienteCf = _cf;//metto il cf in una variabile globale per poterlo leggere successivamente

                                paziente.forEach(function(p) {//per il paziente trovato (1)

                                    //mostro i dati del paziente
                                    var $dati = $("<ul>").addClass("datipaziente");

                                    $dati.append($("<li>").text("DATI PAZIENTE"));
                                    $dati.append($("<li>").text("Nome: " + p.nome));
                                    $dati.append($("<li>").text("Cognome: " + p.cognome));

                                    var temp = new Date(p.dataNascita);
                                    var data = temp.toLocaleDateString(); //converto il formato qualora sia il formato Lungo

                                    $dati.append($("<li>").text("Data nascita: " + data));
                                    

                                    $dati.append($("<li>").text("Codice Fiscale: " + p.codiceFiscale));
                                    $dati.append($("<li>").text("Luogo Nascita: " + p.luogoNascita));
                                    
                                    $content.append($dati);
                                    
                                    //aggiungo lista delle date
                                    $content.append($("<br>"))
                                        .append($date_list)
                                        .append($("<br>"));
                                        
                                });

                                //listener sull'evento change delle date
                                $date_list.on("change", function() {
                                    //ogni volta che viene cambiata la selezione, si resetta il menu successivo e a catena gli altri vengono rimossi
                                    $specialization_list.val("Seleziona una specializzazione");
                                    $content.append($specialization_list);

                                    $med_list.detach();
                                    $orari_list.detach();
                                    $confermaButton.detach();
                                });
                            
                                //listener sull'evento change delle specializzazioni
                                $specialization_list.on("change", function() {
                                    //Metti in variabili le selezioni fatte dai menu a tendina, facendo un controllo che la selezione sia diversa dalla prima scelta(default)
                                    //rimuovo eventuali elementi successivi che erano stati generati e resetto lista medici
                                    $orari_list.detach();
                                    $med_list.detach();
                                    $confermaButton.detach();
                                    $med_list.empty();
                                    $med_list.append($("<option>").text("Seleziona un medico"));
                                    $med_list.val("Seleziona un medico");
                                    $content.append($med_list);

                                    //leggo valore scelto per la data
                                    var selectedDate = $date_list.val();
                                    var selectedSpecialization = $specialization_list.val();
                                    
                                    //se i valori non sono quelli di default procedo
                                    if (selectedDate !== "Seleziona una data" && selectedSpecialization !== "Seleziona una specializzazione") {                                
                                        //visualizzare direttamente una lista di medici specializzati e successivamente alla selezione,una lista di orari dove non esistono già prenotazioni
                                        $.getJSON("/prenotazioni", {"data": selectedDate}, function(prenotazioni){ //recupero le prenotazioni e le passo alla funzione per trovare le disponibilità(avrei potuto farlo direttamente nella funzione)
                                            //passo le prenotazioni alla funzione trovaDisponibilità che restituisce l'elenco dei medici che hanno almeno un orario libero dalle 8 alle 16
                                            
                                            //restituisce l'elenco di idmedico,disponibilità per i medici disponibili
                                            trovaDisponibilità(prenotazioni, selectedSpecialization) //ho bisogno di gestirla con il meccanismo delle promise per via della natura asincrona della getJSON 
                                            .then(function(mediciDisponibili) {//mi restituisce i medici con almeno una disponibilità
                                                //per ogni id_medico vado a prendermi il nome e il cognome e creo una scelta nel menu a tendina
                                                if (mediciDisponibili.length > 0){//Se esiste almeno un medico disponibile per quella data e specializzazione
                                                    
                                                    //A questo punto devo associare l'idMedico al nome e cognome  usando la variabile medici che ho già 
                                                    
                                                    mediciDisponibili.forEach(function(med) {
                                                        //per ogni medico, tramite l'Id recupero il relativo indice nella tabella medici.json, tramite il quale posso recuperare le info anagrafiche
                                                        if (med.disp.length > 0) {
                                                            //medIndex = indice oggetto medico in medici.json
                                                        var medIndex = medici.findIndex(function(medico) {
                                                                return medico.id_medico === med.id;
                                                            });
                                                            //per ognuno dei medici trovati vado ad appendere i dati alla lista per creare un elemento
                                                            var nomeMedico = medici[medIndex].nome;
                                                            var cognomeMedico = medici[medIndex].cognome;

                                                            //aggiungo il dato medIndex all'oggetto option per porterlo trasferire all'atto della scelta del medico
                                                            var $option = $("<option>")
                                                                .text(cognomeMedico + " " + nomeMedico)
                                                                .data("med-index", medIndex);
                                                            $med_list.append($option); 
                                                        }
                                                    });
                                                    //appendo la lista completa al content  
                                                    $content.append($med_list);
                                                }
                        
                                                //listener sull'evento change delle specializzazioni
                                                $med_list.on("change", function(){
                                                    //elimino elementi successivi e riporta a default la lista orari
                                                    $confermaButton.detach();

                                                    $orari_list.empty();
                                                    $orari_list.append($("<option>").text("Seleziona un orario"));
                                                    $orari_list.val("Seleziona un orario");
                                                    
                                                    //se ho selezionato un medico
                                                    if ($med_list.val() !== "Seleziona un medico"){
                                                        $content.append($orari_list); //aggiungi la lista degli orari di disponibilità per quel medico
                                                        //recupero l'indice del medico selezionato tramite l'attributo che avevo aggiunto
                                                        var selectedOption = $(this).find("option:selected");
                                                        //medIndex è l'indice del medico nell'elenco json
                                                        var medIndex = selectedOption.data("med-index");

                                                        //mi collegherò alla lista disponibilità tramite l'id_medico
                                                        
                                                        //i sarà l'indice del medico in mediciDisponibili                                                    
                                                        var i = mediciDisponibili.findIndex(function(medico) {
                                                            return medico.id === medici[medIndex].id_medico;
                                                        });
                                                        if ( i !== -1){ //trovato il medico selezionato nella lista MediciDIsponibili che contiene {idmedico,disponibilita[]}
                                                            var disponibilita = mediciDisponibili[i].disp;//leggo le disponibilità
                                                            
                                                            //mostro gli orari disponibili per il medico
                                                            disponibilita.forEach(function(item) {
                                                                $orari_list.append($("<option>").text(item));
                                                            });
                                                            $content.append($orari_list)//append lista degli orari
                                                        }
                                                    }
                                                });

                                                //listener sulla selezione dell'orario
                                                $orari_list.on("change", function() {
                                                    //rimuove pulsante di conferma 
                                                    $confermaButton.detach();

                                                    //controlla se viene fatta una selezione valida
                                                    if ($orari_list.val() !== "Seleziona un orario") {
                                                        //aggiunge il pulsante di conferma
                                                        $content.append($confermaButton);
                                                    }
                                                });

                                                $confermaButton.off("click");//necessario perchè generavo più segnali con un singolo click

                                                //listener dell'evento di click sul pulsante di conferma
                                                $confermaButton.on("click", function() {
                                                    //legge i valori selezionati nei menu a tendina
                                                    var data = $date_list.val();
                                                    var orarioSelezionato = $orari_list.val();
                                                    
                                                    //ho ancora bisogno di leggere l'id medico perchè nel menu a tendina ho selezionato nome e cognome e per la scrittura di una prenotazione mi serve l'id_medico
                                                    //per leggere l'id medico devo accedere all'oggetto json in medici il cui indice è medIndex
                                                    if ($med_list.val()!== "Seleziona un medico"){
                                                        var selectedOption = $med_list.find("option:selected");
                                                        //medIndex è l'indice del medico nell'elenco json
                                                        var medIndex = selectedOption.data("med-index");
                                                        var MedicoId = medici[medIndex].id_medico;
                                                        
                                                        //crea nuova prenotazione
                                                        var newPrenotazione = {
                                                            "data": data,
                                                            "ora": orarioSelezionato,
                                                            "medicoId": MedicoId,
                                                            "pazienteCf": pazienteCf
                                                        };
                                                        console.log(newPrenotazione);

                                                        //salva nel db la nuova prenotazione
                                                        $.post("prenotazione", newPrenotazione, function(result){              
                                                        })
                                                        
                                                        $date_list.val("Seleziona una data");
                                                        //Mostra un messaggio di avvenuta conferma che resta sullo schermo per 5 secondi e poi sbiadisce, e mostra automaticamnete il pannello delle ultime prenotazioni
                                                        var $notifica = $("<p>").text("Prenotazione confermata");
                                                        $notifica.hide();
                                                        $(".notification-row").append($notifica)
                                                        $notifica.fadeIn(1000).delay(5000).fadeOut();
                                                        
                                                        $(".tabs a:nth-child(2) span").trigger("click");
                                                    }
                                                    
                                                });
                                                
                                            })//cattura eventuali errori e sospende l'attesa della promise
                                            .catch(function(error) {
                                                console.error(error);
                                            });       
                                        });
                                    }
                                });
                            //altrimenti se non ho inserito un codiceFiscale valido mostra messaggio di errore
                            }else if (paziente.length=== 0 && !erroreAppeso){

                                var $errore = $("<p>").addClass("notifica_errore").text("Codice fiscale non valido");
                                $content.append($errore);
                                //$content.append("<p>").addClass("notifica_errore").text("Codice fiscale non valido")
                                // Aggiornamento della variabile di controllo
                                erroreAppeso = true;
                            }
                        });
                    }
                });

                
                //listener sul tasto enter che replica il click sul pulsante Invia del codice fiscale
                $cf_input.on("keypress", function(event) {
                    if ((event.key === "Enter")&&($cf_input.val() !== "") ) {
                        $button.trigger("click");
                    }
                });

                
            //listener del pulsante due per la visualizzazione delle ultime prenotazioni
            } else if ($element.parent().is(":nth-child(2)")) {
                $content = $("<div>");
                $content.append("<h2>").text("Questa vista permette di visualizzare le ultime prenotazioni effettuate a scopo di verifica del caso d'uso implementato (Effettua prenotazione)")

                //recupera prenotazioni
                $.getJSON("/prenotazioni", function(prenotazioni){
                    
                    //Creo una tabella
                    var $table = $("<table>").addClass("prenotazioniTable");
                    var $thead = $("<thead>");
                    var $tbody = $("<tbody>");

                    // Aggiungi la riga dell'intestazione
                    var $headerRow = $("<tr>");
                    $headerRow.append($("<th>").text("Data"));
                    $headerRow.append($("<th>").text("Ora"));
                    $headerRow.append($("<th>").text("Medico ID"));
                    $headerRow.append($("<th>").text("Paziente CF"));
                    $thead.append($headerRow);

                    // Visualizza solo le ultime 10 prenotazioni
                    prenotazioni.reverse();
                    var slicedPrenotazioni = prenotazioni.slice(0, 20);

                    // Aggiungi le righe dei dati delle prenotazioni
                    slicedPrenotazioni.forEach(function(item) {
                        var $row = $("<tr>");
                        $row.append($("<td>").text(item.data.split('T')[0]));
                        $row.append($("<td>").text(item.ora));
                        $row.append($("<td>").text(item.medicoId));
                        $row.append($("<td>").text(item.pazienteCf));
                        $tbody.append($row);
                    });

                    $table.append($thead);
                    $table.append($tbody);

                    $content.append($table);
                })
               
            } else if ($element.parent().is(":nth-child(3)")) {
                $content = $("<p>").text("Funzione non implementata");

            } else if ($element.parent().is(":nth-child(4)")) {
                $content = $("<p>").text("Funzione non implementata");
            } else if ($element.parent().is(":nth-child(5)")) {
                $content = $("<p>").text("Funzione non implementata");
            } else if ($element.parent().is(":nth-child(6)")) {
                $content = $("<p>").text("Funzione non implementata");
            } else if ($element.parent().is(":nth-child(7)")) {
                $content = $("<p>").text("Funzione non implementata");
            }

            $("main .content").append($content);//aggiungi tutto a main .content

            return false;
        });
    });

    //di default parti dalla prima schermata
    $(".tabs a:first-child span").trigger("click");
};

//poiché la richiesta $.getJSON è asincrona, il valore di mediciDisponibili non sarà disponibile immediatamente dopo la chiamata a trovaDisponibilità. Quindi, non è possibile restituire direttamente mediciDisponibili dal corpo della funzione. Una soluzione a questo problema è utilizzare una promessa per gestire la logica asincrona e restituire mediciDisponibili come risultato della promessa.

var trovaDisponibilità = function(prenotazioni, specializzazione) {
    
    //Voglio ottenere una matrice del genere fatta di soli metodi specializzati e disponibili
    /*var mediciDisponibili = [
      { id: 1, disp: [8, 9, 10, 11, 12,13,14,15,16]},
      { id: 2, disp:[8, 9, 10, 11, 12,13,14,15,16] }
    ];*/

    return new Promise(function(resolve, reject) {
        var mediciDisponibili = [];
        var orariBaseDisponibili = [8, 9, 10, 11, 12,13,14,15,16];
    
        $.getJSON("/medici", {"specializzazione": specializzazione}, function(medici){//leggo i medici specializzati
            //popola matrice dei medici disponibili
            medici.forEach(function(medico) {
                var nuovoMedico = { id: medico.id_medico, disp: orariBaseDisponibili.slice() }; //uso slice per clonare l'array di base
                mediciDisponibili.push(nuovoMedico);
            });
    
            //per ogni prenotazione recupero orario e id medico e per quel medico vado a rimuovere la disponibilità in quell'orari
            prenotazioni.forEach(function(prenotazione) {
                //legge orario dalla prenotazione
                var orarioPrenotazione = prenotazione.ora;
        
                //recupera l'indice del medico in mediciDisponibili nel nuovo array cercandolo per idmedico
                var medicoIndex = mediciDisponibili.findIndex(function(medico) {    
                    return medico.id === prenotazione.medicoId;
                });
        
                if (medicoIndex !== -1) { //qui medicoIndex conterrà l'indice del medico nella struttura dati mediciDisponibili 

                    //controlla se l'orario è presente nelle disponibilità
                    var orarioIndex = mediciDisponibili[medicoIndex].disp.indexOf(orarioPrenotazione);
                    //se è presente lo rimuove
                    if (orarioIndex !== -1) {
                        //cancella l'orario dall'elenco relativo al medico
                        mediciDisponibili[medicoIndex].disp.splice(orarioIndex, 1);
                    }
                }
            });
            resolve(mediciDisponibili); //equivale ad un return

        }).fail(function(jqXHR, textStatus, errorThrown){
            reject(errorThrown);
        })
    })
}
  


$(document).ready(function () {//quando sono stati caricati tutti gli elementi del DOM
    //leggi i medici per ottenere all'interno del main la lista delle specializzazioni
    $.getJSON("/medici", function(medici){
        main(medici);
    })
    .fail(function(jqXHR, textStatus, error){//se la getJSON non va buon fine gestisci errori
        console.log(jqXHR);
		console.log(textStatus);
		console.log(error);
        if (jqXHR.status === 404 ){
            alert("ERROR 404 NOT FOUND ");
        }
        else{
            console.log("ERRORE GENERICO");
        }
    })
});