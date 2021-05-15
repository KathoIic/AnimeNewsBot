'use strict';
var Discord = require('discord.js');
const ytdl = require("ytdl-core");

var auth = require('./auth.json');
var settings = {};
var BreakException = {};
const queue = new Map();

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function writeOnFile() {
	const fs = require('fs');
    let path = "settings.json";
	let buffer = Buffer.from(JSON.stringify(settings));

	fs.open(path, 'w', function(err, fd) {
		if (err) {
			throw 'could not open file: ' + err;
		}

		fs.write(fd, buffer, 0, buffer.length, null, function(err) {
			if (err) throw 'error writing file: ' + err;
			fs.close(fd, function() {
				console.log('wrote the file successfully');
				});
			});
	});
}
function getIDAnime(nome_anime){
	var request = require('request');
	var id_anime = '';
	request('https://api.jikan.moe/v3/search/anime?type=anime&order_by=ascending&q='+nome_anime, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			const obj = JSON.parse(body);
			id_anime = obj.results[0].mal_id;
			return id_anime;
		}
	});
	return id_anime;
}

function readOnFile() {

	settings = require('./settings.json');
	console.log(settings);
	 
}

const token = auth.token;
const client = new Discord.Client();


// quando il server è avviato
// l'evento viene attivato
client.once('ready', () => {
	readOnFile();
	/*
	const channel = client.channels.cache.get("706847205029576725");
			if (!channel) return console.error("The channel does not exist!");
			channel.join().then(connection => {
				// Yay, it worked!
				console.log("Successfully connected.");
			}).catch(e => {
				// Oh no, it errored! Let's log it to console :)
				console.error(e);
			});*/
});

// serve per connettere discord con il bot
client.login(token);


client.on('message', async message => {
	let array = settings.blacklist;
	if(!array.some(item => item.id === message.channel.id)){

		if (message.content.toLowerCase().includes('.esci')) {
			client.leaveVoiceChannel(message.author.voiceChannel);
			message.channel.createMessage(`Il bot delle News è uscito!`);;
		}
		if (message.content.toLowerCase().includes('.entra')) {
			if (message.member.voice.channel) {
				const connection = message.member.voice.channel.join();
			  } else {
				message.reply('Devi essere in un canale vocale prima');
			  }
		}

		//--------------------- COMANDO BLACKLIST -------------------
		if (message.content.toLowerCase().includes('.blacklist')) {
			let array2 = message.content.split(" ");
			let id_channel = array2[1].substring(2,array2[1].length - 1);
			let channels = new Map();
			channels = client.channels.cache;
			console.log(channels);
			let nome = channels.get(id_channel).name;
			try {
				console.log(settings.blacklist);
				if(!array.some(item => item.id === id_channel)){
					settings.blacklist.push({id : id_channel, name: nome});
					writeOnFile();
					message.channel.send("Blacklisted "+ nome);
				}
				else{
					message.channel.send("Il canale è stato già Blacklistato!");
				}
			} catch (error) {
				message.channel.send("Comando non trovato o errato! ");
			}
		}

		//--------------------- COMANDO UNBLACKLIST -------------------
		else if (message.content.toLowerCase().includes('.unblacklist')) {
			let array2 = message.content.split(" ");
			let id_channel = array2[1].substring(2,array2[1].length - 1);
			let channels = new Map();
			channels = client.channels.cache;
			let nome = channels.get(id_channel).name;
			try {
				console.log(settings.blacklist);
				if(array.some(item => item.id === id_channel)){
					settings.blacklist = settings.blacklist.filter(function(e){ 
						return e.id != id_channel; 
				   	});
					writeOnFile();
					message.channel.send("Blacklisted rimosso su "+ nome);
				}
				else{
					message.channel.send("Il canale non è Blacklistato!");
				}
			} catch (error) {
				console.log(error);
			}
		}

		//--------------------- COMANDO SEASON -------------------
		else if(message.content.toUpperCase() === '.Season'.toUpperCase()){
			var request = require('request');
			request('https://api.jikan.moe/v3/season/2020/summer', function (error, response, body) {
				if (!error && response.statusCode == 200) {
					const obj = JSON.parse(body);
					console.log(obj.anime[0]);
					message.channel.send(obj.anime[0].title, {files: [obj.anime[0].image_url]});
				}
			})
		}

		//--------------------- COMANDO NEWS -------------------
		else if(message.content.toUpperCase() === '.News'.toUpperCase()){
			var request = require('request');
			var d = new Date();
			var weekday = new Array(7);
			weekday[0] = "Sunday";
			weekday[1] = "Monday";
			weekday[2] = "Tuesday";
			weekday[3] = "Wednesday";
			weekday[4] = "Thursday";
			weekday[5] = "Friday";
			weekday[6] = "Saturday";
			var n = weekday[d.getDay()];
			console.log(n);
			request('https://api.jikan.moe/v3/schedule/' + n, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					message.channel.send("Oggi usciranno gli anime: ");
					const obj = JSON.parse(body);
					n = n.toLowerCase();
					//trasforma la stringa della settimana in una variabile da poter usare sul json
					const array= eval("obj."+ n);
					array.forEach(element => {
						if(!element.kids  && element.members > 5000)
							message.channel.send(element.title, {files: [element.image_url]} );
					});
				}
			});
		}


		//--------------------- COMANDO USCITE -------------------
		
		else if(message.content.toUpperCase() === '.uscite'.toUpperCase()){
			var request = require('request');
			request('https://api.jikan.moe/v3/schedule', function (error, response, body) {
				if (!error && response.statusCode == 200) {
					//console.log(response);
					//message.channel.send("Oggi usciranno gli anime: ");
					//const obj = JSON.parse(body);
					//console.log(body);
					const obj = JSON.parse(body);

					var weekday = new Array(7);
					weekday[0] = "monday";
					weekday[1] = "tuesday";
					weekday[2] = "wednesday";
					weekday[3] = "thursday";
					weekday[4] = "friday";
					weekday[5] = "saturday";
					weekday[6] = "sunday";
					let testo = "";
					weekday.forEach(week => {
						const array = eval("obj." + week);
						testo += "\n```css\n["+capitalizeFirstLetter(week) + "]\n";
						array.forEach(anime => {
							if(!anime.kids  && anime.members > 5000)
								testo += ""+anime.title +", ";
						});
						testo +="```";
					});
					message.channel.send(testo+"\n> Bot by Stefano Quartuccio");
					

					/*
					array.forEach(element => {
						if(!element.kids  && element.members > 5000)
							message.channel.send(element.title, {files: [element.image_url]} );
					});
					*/
				}
			});
		}
		else if(message.content.startsWith(`.play`)){
			
			const voiceChannel = message.member.voice.channel;
			if (!voiceChannel)
			return message.channel.send(
				'```css\n[O Babbo colione non sei in un canale grr.. \n ```\n> Bot by Stefano Quartuccio'
			);

			const permissions = voiceChannel.permissionsFor(message.client.user);
			if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
				return message.channel.send(
					'```css\n[O Babbo colione non ho i permessi per entrare grr.. \n ```\n> Bot by Stefano Quartuccio'
				);
			}

			const voiceChannelID = message.member.voice.channelID;

			const channel = client.channels.cache.get(voiceChannelID);
			if (!channel) return console.error("The channel does not exist!");
			channel.join().then(connection => {
				// Yay, it worked!
				console.log("Successfully connected.");
			}).catch(e => {
				// Oh no, it errored! Let's log it to console :)
				console.error(e);
			})

			const serverQueue = queue.get(message.guild.id);

			execute(message, serverQueue);

			message.channel.send('```css\n[O guarda colione sono entrato \n ```\n> Bot by Stefano Quartuccio' );
		}
		else if (message.content.startsWith(`.skip`)) {
			let serverQueue = queue.get(message.guild.id);
			skip(message, serverQueue);
			return;
		}
		else if (message.content.startsWith(`.clear`)){ 
			let serverQueue = queue.get(message.guild.id);
			clear(message, serverQueue);
			return;
		}
		//--------------------- COMANDO RACCOMANDATI -------------------
		else if(message.content.toUpperCase().includes('.recommendations'.toUpperCase())){
			var request = require('request');
			let nome_anime = message.content.split(" ")[1].trim();

			request('https://api.jikan.moe/v3/search/anime?type=anime&order_by=ascending&q='+nome_anime, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					const obj = JSON.parse(body);
					let id_anime = obj.results[0].mal_id;
					request('https://api.jikan.moe/v3/anime/'+id_anime+'/recommendations', function (error2, response2, body2) {
						const obj2 = JSON.parse(body2);
						let recommendations = obj2.recommendations;
						let title = '';
						let count = 0;
						try {
							recommendations.forEach(anime => {
								title += anime.title + ', ';
								if (count == 20) {
									throw BreakException;
								}
								count++;
							});
						}catch(e){if (e !== BreakException) throw e;}
						message.channel.send('```css\n[Gli anime simili a '+ nome_anime + ' sono:] \n '+ title + "```\n> Bot by Stefano Quartuccio" );
					});

				}
			});
		}
	}
});


async function execute(message, serverQueue){
	const args = message.content.split(" ");
	const songInfo = await ytdl.getInfo(args[1]);
	const voiceChannel = message.member.voice.channel;
	const song = {
			title: songInfo.videoDetails.title,
			url: songInfo.videoDetails.video_url,
	};

	if (!serverQueue) {
		const queueContruct = {
		textChannel: message.channel,
		voiceChannel: voiceChannel,
		connection: null,
		songs: [],
		volume: 5,
		playing: true
		};

		queue.set(message.guild.id, queueContruct);

		queueContruct.songs.push(song);

		try {
		var connection = await voiceChannel.join();
		queueContruct.connection = connection;
		play(message.guild, queueContruct.songs[0]);
		} catch (err) {
		console.log(err);
		queue.delete(message.guild.id);
		return message.channel.send(err);
		}
	} else {
		serverQueue.songs.push(song);
		return message.channel.send(`${song.title} has been added to the queue!`);
	}

	function play(guild, song) {
		const serverQueue = queue.get(guild.id);
		if (!song) {
		  serverQueue.voiceChannel.leave();
		  queue.delete(guild.id);
		  return;
		}
	  
		const dispatcher = serverQueue.connection
		  .play(ytdl(song.url))
		  .on("finish", () => {
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		  })
		  .on("error", error => console.error(error));
		dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
		serverQueue.textChannel.send(`Start playing: **${song.title}**`);
	  }
}


function skip(message, serverQueue) {
	if (!message.member.voice.channel)
	  return message.channel.send(
		"\n>You have to be in a voice channel to stop the music!\n>Bot by Stefano Quartuccio"
	  );
	if (!serverQueue)
	  return message.channel.send("There is no song that I could skip!\n> Bot by Stefano Quartuccio");
	serverQueue.connection.dispatcher.end();
  }


function clear(message, serverQueue) {
	if (!message.member.voice.channel)
	  return message.channel.send(
		"You have to be in a voice channel to clear all the music!"
	  );
	
	if (!serverQueue)
	  return message.channel.send("There is no song that I could stop!");
	  
	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
  }