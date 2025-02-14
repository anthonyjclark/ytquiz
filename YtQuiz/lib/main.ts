import { html } from 'htl';

// DOCS(controlling playback): https://developers.google.com/youtube/iframe_api_reference#Playback_controls
// DOCS(query playback status): https://developers.google.com/youtube/iframe_api_reference#Playback_status

// TODO:
// - reset questions as unanswered
// - allow disabling questions
// - handle question/answer submission
// - handle multiple videos on a single page

enum YtApiState {
	NotLoaded,
	Loading,
	Loaded,
}

let globalYtApiState = YtApiState.NotLoaded;
let globalYtQuizzes: { [key: string]: YtQuiz } = {};

function initYtApi() {

	( window as any ).onYouTubeIframeAPIReady = () => {

		globalYtApiState = YtApiState.Loaded;
		console.log( 'YT API loaded' );

		for ( const videoId in globalYtQuizzes ) {

			const quiz = globalYtQuizzes[videoId];
			quiz.createPlayer();

		}

	};

	// Create a script tag to load the YouTube IFrame Player API
	const scriptTag = document.createElement( 'script' );
	scriptTag.src = 'https://www.youtube.com/iframe_api';

	// Insert the script tag into the document before the first script tag
	const firstScriptTag = document.getElementsByTagName( 'script' )[0];
	firstScriptTag?.parentNode?.insertBefore( scriptTag, firstScriptTag );

}

type Question = {
	time: number | string,
	question: string,
	answers: string[],
	correct: number | string,
	completed?: boolean,
};

enum QuestionType {
	MultipleChoice,
	FillInTheBlank,
}

function processTime( time: number | string ): number {

	if ( typeof time === 'string' ) {

		const [ minutes, seconds ] = time.split( ':' ).map( num => parseInt( num, 10 ) );
		return minutes * 60 + seconds;

	}

	return time;

}

export class YtQuiz {

	player?: YT.Player;
	questions: Question[];
	questionTimer?: ReturnType<typeof setTimeout>;

	videoId: string;

	constructor( videoId: string, questions: Question[] ) {

		this.videoId = videoId;
		this.questions = questions;

		if ( globalYtApiState === YtApiState.NotLoaded ) {

			console.log( 'Loading YT API...' );
			globalYtApiState = YtApiState.Loading;
			initYtApi();

		}

		if ( globalYtApiState !== YtApiState.Loaded ) {

			globalYtQuizzes[videoId] = this;

		} else {

			this.createPlayer();

		}

	}

	html(): HTMLElement {

		return html`
		<div style="width: 100%; aspect-ratio: 16 / 9;">
    	<div id="yt-quiz-${this.videoId}"></div>
    	<div id="yt-quiz-question-${this.videoId}"></div>
		</div> `;

	}

	createPlayer(): void {

		// DOCS(supported parameters): https://developers.google.com/youtube/player_parameters
		this.player = new YT.Player( `yt-quiz-${this.videoId}`, {
			height: '100%',
			width: '100%',
			videoId: this.videoId,
			playerVars: { 'playsinline': 1 },
			events: {
				onReady: event => this.onPlayerReady( event ),
				onStateChange: event => this.onPlayerStateChange( event ),
			},
		} );

	}

	onPlayerReady( event: any ): void {

		console.log( 'Player is ready', event );
		// _event.target.playVideo();

	}

	onPlayerStateChange( event: any ): void {

		console.log( 'Player state changed', event );

		if ( event.data == YT.PlayerState.PLAYING ) {

			this.questionTimer = setTimeout( () => this.displayQuestionCheck(), 1000 );

		} else if ( event.data == YT.PlayerState.PAUSED || event.data == YT.PlayerState.ENDED ) {

			clearTimeout( this.questionTimer );

		}

	}

	displayQuestionCheck(): void {

		const currentTime = this.player?.getCurrentTime();

		console.log( 'displayQuestionCheck', currentTime );

		// Compare current time with all question times
		for ( const question of this.questions ) {

			const questionTime = processTime( question.time );

			if ( ! question.completed && currentTime && currentTime >= questionTime ) {

				this.player?.pauseVideo();
				this.displayQuestion( question );
				return;

			}

		}

		this.questionTimer = setTimeout( () => this.displayQuestionCheck(), 1000 );

	}

	displayQuestion( question: Question ): void {

		question.completed = true;

		const questionDiv = document.querySelector( `#yt-quiz-question-${this.videoId}` );

		if ( ! questionDiv ) return;

		const questionType = question.answers.length ? QuestionType.MultipleChoice : QuestionType.FillInTheBlank;

		let questionOptions;
		if ( questionType === QuestionType.MultipleChoice ) {

			questionOptions = `${question.answers.map( ( answer, index ) => `
				<label style="display: block" for="choice${index}">
					<input type="radio" id="yt-quiz-choice-${this.videoId}-${index}" name="answer" value="${index}" />${answer}
				</label>
				` ).join( '' )}`;

		} else if ( questionType === QuestionType.FillInTheBlank ) {

			questionOptions = `
				<input type="text" name="answer" />
				<div id="yt-quiz-solution-${this.videoId}"></div>
			`;

		} else {

			return;

		}

		questionDiv.innerHTML = `
			<form id="yt-quiz-form-${this.videoId}" class="yt-quiz-container">
				<fieldset>
					<div>${question.question}</div>

					<div>${questionOptions}</div>

					<div class="yt-quiz-controls">
						<button id="yt-quiz-submit-${this.videoId}" type="submit" disabled>Submit</button>
						<button id="yt-quiz-continue-${this.videoId}" class="secondary">Continue</button>
					</div>
				</fieldset>
			</form>
		`;

		const form = document.querySelector( `#yt-quiz-form-${this.videoId}` ) as HTMLFormElement;
		const submitButton = document.querySelector( `#yt-quiz-submit-${this.videoId}` ) as HTMLButtonElement;
		const continueButton = document.querySelector( `#yt-quiz-continue-${this.videoId}` ) as HTMLButtonElement;

		form.onsubmit = ( event ) => {

			event.preventDefault();

			const form = event.target as HTMLFormElement;

			let correct = false;
			let correctMessage = '';

			if ( questionType === QuestionType.FillInTheBlank ) {

				const solutionDiv = document.querySelector( `#yt-quiz-solution-${this.videoId}` );
				if ( solutionDiv ) solutionDiv.textContent = `Answer: "${question.correct as string}"`;

				correct = true;
				correctMessage = 'Thanks!';

			} else if ( questionType === QuestionType.MultipleChoice ) {

				const answer = form.answer.value;
				correct = question.correct === parseInt( answer );
				correctMessage = 'Correct!';

				const radio = document.querySelector( `#yt-quiz-choice-${this.videoId}-${answer}` ) as HTMLInputElement;
				radio.parentElement?.classList.add( correct ? 'yt-quiz-correct' : 'yt-quiz-incorrect' );
				radio.setAttribute( 'aria-invalid', correct ? 'false' : 'true' );

			}

			if ( correct ) {

				submitButton.disabled = true;
				submitButton.textContent = correctMessage;

			} else {

				submitButton.textContent = 'Try again';

			}

		};

		form.onchange = ( event ) => {

			event.preventDefault();

			submitButton.disabled = false;

		};

		form.oninput = ( event ) => {

			event.preventDefault();

			submitButton.disabled = false;

		};

		continueButton.onclick = () => {

			this.player?.playVideo();
			this.questionTimer = setTimeout( () => this.displayQuestionCheck(), 1000 );

		};

	}

}
