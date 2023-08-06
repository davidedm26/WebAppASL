//import dei vari moduli di interesse
var express = require("express"), //importa express
    http = require("http"),
    mongoose = require("mongoose"), //importa mongoose
    app = express();//inizializzare un'applicazione Express.js. 
    //Express.js è un framework web per Node.js che semplifica lo sviluppo di applicazioni web e API.

app.use(express.static(__dirname + "/client")); //definisci path dove si trova il file index.html

app.use(express.urlencoded({ extended: true})); //E' uno dei metodi possibili, un altro era bodyParser
//i dati vengono inviati come una stringa di query nel corpo della richiesta HTTP.


// connect all' ASL data store in mongoDB
mongoose.connect(
    "mongodb://127.0.0.1:27017/ASLNapoli1",
    {useNewUrlParser:true})//Prima della versione 3.1 del driver MongoDB per Node.js, il parser di stringhe dell'URL predefinito era deprecato e doveva essere esplicitamente disabilitato impostando l'opzione useNewUrlParser 
    .then(()=>{
        console.log("Connected to MongoDB");
    })
    .catch(()=>{
        console.log("Couldn't connect to MongoDB");
    })
    

// 4. Definire schemas 
 var pazienteSchema =  mongoose.Schema({
    codiceFiscale: String,
    nome: String,
    cognome: String,
    dataNascita: Date,
    luogoNascita: String
    
  });

var medicoSchema = mongoose.Schema({
    id_medico : Number,
    nome : String,
    cognome: String,
    specializzazione: String
})

var prenotazioneSchema = mongoose.Schema({
    medicoId : Number,
    pazienteCf : String,
    data: Date,
    ora: Number
})

//Definire i modelli
var Paziente = mongoose.model('Paziente', pazienteSchema);
var Medico = mongoose.model('Medico', medicoSchema);
var Prenotazione = mongoose.model('Prenotazione', prenotazioneSchema);

//avvia il server passandogli l'istanza di app
http.createServer(app).listen(3000);
console.log('Server running at http://localhost:3000/');

// Definire le rotte
// Restituisce il paziente relativo al CF o un oggetto vuoto se non esiste
app.get("/paziente/cf", function(req, res){
	
    var codice_fiscale = req.query.codice_fiscale;//legge il codice fiscale ricevuto

	// Controlla se il cf è relativo a un paziente registrato nel db
    Paziente.find({"codiceFiscale": codice_fiscale }, function(err, paziente) {
        if (err) {
            console.error(err);
        } else {
            if (paziente.length > 0) {
                // Il paziente con il codice fiscale specificato esiste nel database
                res.json(paziente);//invia la risposta in json
            } else{
                // Il paziente con il codice fiscale specificato non esiste nel database
                console.log("[ERRORE] Il paziente non è registrato.");
                res.json(paziente);//invia l'oggetto vuoto
            }
        }
    });

});


//rotta per richiedere l'elenco dei medici, eventualmente solo per una specializzazione
app.get("/medici", function(req, res){
	
    filter = req.query.specializzazione != null? {specializzazione: req.query.specializzazione} : {};//controlla se c'è il parametro specializzazione

	// Controlla se ci sono medici ( o medici specializzati)
    Medico.find(filter, function(err, medici) {
        if (err) {
            console.error(err);
        } else {
            if (medici.length > 0) {
                // Esistono medici                
                res.json(medici);
            } else {
                // Errore
                console.log("[ERRORE] Nessun medico trovato.");
            }
        }
    });
});

//rotta per richiedere le prenotazioni( tutte o con parametro data)
app.get("/prenotazioni", function (req, res) {
    
    filter = req.query.data != null? {data: req.query.data} : {}; //Controlla se c'è il parametro data

    Prenotazione.find(filter, function(err, prenotazioni) {
        if (err!== null){
            console.log("ERROR: "+ err);
        } else {
            //Prenotazioni trovate
            res.json(prenotazioni);
        }
    })
});

//rotta per aggiungere una prenotazione
app.post("/prenotazione", function(req, res) {
   //crea un nuovo oggetto prenotazione leggendo i dati dal body della richiesta
    var newPren = new Prenotazione({
        medicoId: req.body.medicoId,
        pazienteCf: req.body.pazienteCf,
        data: req.body.data,
        ora: req.body.ora
    })

    newPren.save(function (err,pren){
        if(err){
            console.log(err);
        }
		else{
			//Prenotazione.find({}, function(err, prenotazioni){
				//if(err){
                    //console.log(err);
                //}
				//console.log("Ho fatto la POST"+ prenotazioni);
                //res.json(prenotazioni);
            //})
            console.log("Prenotazione salvata");         
		}
    })
})

