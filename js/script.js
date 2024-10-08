let currentsong = new Audio(); //the song which is currently playing
let songList; //list of songs of current playing song's folder
let songul; // DOM li of current playing folder's songs
let currfol; // name of current playing folder
let currentPlayingElement = null; // DOM li of current playing song, To keep track of the currently playing element


// fetch images of mp3 file
async function getpicofmp3(mp3Files) {
    let newArray = new Array(mp3Files.length).fill(null); // Initialize the array with null values to maintain order
    let promises = mp3Files.map((url, index) =>
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                const file = new File([arrayBuffer], url.split('/').pop(), { type: 'audio/mpeg' });
                return new Promise((resolve) => {
                    jsmediatags.read(file, {
                        onSuccess: function (tag) {
                            const tags = tag.tags;
                            if (tags.picture) {
                                const byteArray = new Uint8Array(tags.picture.data);
                                const blob = new Blob([byteArray], { type: tags.picture.format });
                                const imageUrl = URL.createObjectURL(blob);
                                newArray[index] = imageUrl; // Assign image URL to the correct index
                            } else {
                                console.log('No image found in this MP3 file.');
                            }
                            resolve();
                        },
                        onError: function (error) {
                            console.error('Error reading MP3 file:', error);
                            resolve(); // Resolve even if there is an error to continue processing
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching MP3 file:', error);
            })
    );

    await Promise.all(promises);
    return newArray;
}

// fetch data from song folders and display the folders as card on the webpage
async function getalbum() {
    let response = await fetch(`/songs/`);
    let html = await response.text();
    let div = document.createElement("div");
    div.innerHTML = html;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardcontainer");
    let array = Array.from(anchors);

    for (let e of array) {
        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/").slice(-2)[0];
            let response = await fetch(`/songs/${folder}/info.json`);
            let info = await response.json();
            cardContainer.innerHTML += `<div class="card firca" data-folder="${folder}">
                <div class="playpic">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                            stroke-linejoin="round" />
                    </svg>
                </div>
                <img src="/songs/${folder}/cover.jpg" alt="card">
                <p class="boro">${info.title}</p>
                <p class="choto">${info.description}</p>
            </div>`;
        }
    }

    document.querySelectorAll(".card").forEach(e => {
        e.addEventListener("click", async (item) => {
            songList = await getsong(`songs/${item.currentTarget.dataset.folder}`);
            playmusic(songList[0].split(`/${currfol}/`)[1]);
        });
    });
}

// handle click event listener on the list of songs in sidebar
function handleListItemClick(e, index) {
    let playButton = e.querySelector(".libplay");
    let playnowText = e.querySelector(".playnow");

    // Reset the previously playing element
    if (currentPlayingElement) {
        currentPlayingElement.querySelector(".libplay").src = "svgs/play.svg";
        currentPlayingElement.querySelector(".playnow").textContent = "Play";
    }

    // Update the current playing element
    currentPlayingElement = e;

    // Update the index for the current playing element
    updateCurrentPlayingElement(index);

    // Play the clicked song
    playmusic(e.querySelector(".lekh").innerHTML);

    // Update the UI for the clicked song
    playButton.src = "svgs/paused.svg";
    playnowText.textContent = "Playing";
}

// fetch mp3 song files from current used folder and update the song list of sidebar on webpage
async function getsong(currentfolder) {
    currfol = currentfolder;
    try {
        let response = await fetch(`/${currentfolder}/`);
        let html = await response.text();
        let div = document.createElement("div");
        div.innerHTML = html;
        let anchors = div.querySelectorAll("a");
        let songs = Array.from(anchors).filter(anchor => anchor.href.endsWith(".mp3")).map(anchor => anchor.href);
        let pictures = await getpicofmp3(songs);
        songul = document.querySelector(".songList ul");
        songul.innerHTML = "";
        songs.forEach((song, index) => {
            let pic = pictures[index];
            songul.innerHTML += `<li class="li">
                <img class="coverImage" src="${pic ? pic : 'default.jpg'}" alt="song">
                <div class="lekh">${decodeURIComponent(song.split(`/${currfol}/`)[1])}</div>
                <div class="playnow">Play</div>
                <img class="libplay" src="svgs/play.svg" alt="play"></img>
            </li>`;
        });

        currentPlayingElement = document.querySelector(".songList li");
        document.querySelectorAll(".songList li").forEach((e, index) => {
            e.addEventListener("click", () => {
                handleListItemClick(e, index);
            });
        });

        return songs;
    } catch (error) {
        console.error('Error fetching song list:', error);
        return [];
    }
}

// playmusic and update details regarding current playing song in webpage
const playmusic = (track, pause = false) => {
    currentsong.src = `${currfol}/` + track;
    console.log("chole naki?")
    if (!pause) {
        currentsong.play();
        console.log("cholche")
        document.querySelector('#play').src = "svgs/paused.svg";
        if (currentPlayingElement) {
            currentPlayingElement.querySelector(".libplay").src = "svgs/paused.svg";
            console.log(currentPlayingElement)
            currentPlayingElement.querySelector(".playnow").textContent = "Playing";
        }
    }
    document.querySelector(".info").innerHTML = track.replaceAll("%20", " ");
}

function playpause(img) {
    img.src = "svgs/paused.svg";
}

// return second and minute of current playing song 
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// after finishing the current song this function autoplay the next song from that folder
function autoplay() {
    let index = songList.indexOf(currentsong.src)
    if(songList[index + 1] !== undefined){
        currentPlayingElement = songul.childNodes[index + 1]
        playmusic(songList[index + 1].split(`/${currfol}/`)[1]);
    }
}

// main function which is run at the first
async function main() {
    songList = await getsong("songs/firstsong");
    if (songList.length === 0) return;

    playmusic(songList[0].split(`/${currfol}/`)[1], true);
    getalbum();


    document.querySelectorAll(".songList li").forEach((e, index) => {
        e.addEventListener("click", () => {
            handleListItemClick(e, index);
        });
    });

    document.querySelector("#play").addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            document.querySelector('#play').src = "svgs/paused.svg";
            if (currentPlayingElement) {
                currentPlayingElement.querySelector(".libplay").src = "svgs/paused.svg";
                currentPlayingElement.querySelector(".playnow").textContent = "Playing";
            }
        } else {
            currentsong.pause();
            document.querySelector('#play').src = "svgs/play.svg";
            if (currentPlayingElement) {
                currentPlayingElement.querySelector(".libplay").src = "svgs/play.svg";
                currentPlayingElement.querySelector(".playnow").textContent = "Play";
            }
        }
    });

    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".time").innerHTML = `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left = ((currentsong.currentTime / currentsong.duration) * 100) - 1 + "%";
    });

    document.querySelector(".bar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = (currentsong.duration * percent) / 100;
    });

    currentsong.addEventListener("ended", () => {
        document.querySelector("#play").src = "svgs/play.svg";
        if (currentPlayingElement) {
            currentPlayingElement.querySelector(".libplay").src = "svgs/play.svg";
            currentPlayingElement.querySelector(".playnow").textContent = "Play";
        }
        autoplay();
    });

    document.querySelector("#previous").addEventListener("click", () => {
        let index = songList.indexOf(currentsong.src);
        if (index > 0) {
            let song = songList[index - 1].split(`/${currfol}/`)[1];
            playmusic(song);
            updateCurrentPlayingElement(index - 1);
        }
    });

    document.querySelector("#next").addEventListener("click", () => {
        let index = songList.indexOf(currentsong.src);
        if (index < songList.length - 1) {
            let song = songList[index + 1].split(`/${currfol}/`)[1];
            playmusic(song);
            updateCurrentPlayingElement(index + 1);
        }
    });

    document.querySelector("#volrang").addEventListener("input", e => {
        currentsong.volume = parseInt(e.target.value) / 100;
        if (currentsong.volume > 0) {
            document.querySelector(".volume>img").src.replace("svgs/mute.svg", "svgs/volume.svg");
        }
    });

    document.querySelector(".ham").addEventListener("click", () => {
        document.querySelector(".left").style.left = 0;
    });

    document.querySelector(".cross").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-620px";
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("svgs/volume.svg")) {
            e.target.src = e.target.src.replace("svgs/volume.svg", "svgs/mute.svg");
            currentsong.volume = 0;
            document.querySelector("#volrang").value = 0;
        } else {
            e.target.src = e.target.src.replace("svgs/mute.svg", "svgs/volume.svg");
            currentsong.volume = 0.10;
            document.querySelector("#volrang").value = 10;
        }
    });
}

// The function to update the current playing element
function updateCurrentPlayingElement(newIndex) {
    if (currentPlayingElement) {
        currentPlayingElement.querySelector(".libplay").src = "svgs/play.svg";
        currentPlayingElement.querySelector(".playnow").textContent = "Play";
    }
    currentPlayingElement = document.querySelectorAll(".songList li")[newIndex];
    currentPlayingElement.querySelector(".libplay").src = "svgs/paused.svg";
    currentPlayingElement.querySelector(".playnow").textContent = "Playing";
}

main();
