// DOCS(controlling playback): https://developers.google.com/youtube/iframe_api_reference#Playback_controls
// DOCS(query playback status): https://developers.google.com/youtube/iframe_api_reference#Playback_status

// TODO:
// - reset questions as unanswered
// - allow disabling questions
// - handle question/answer submission
// - handle multiple videos on a single page

type Question = {
	time: number,
	question: string,
	answers: string[],
	correct: number,
	completed?: boolean,
};

export class YtQuiz {

	player?: YT.Player;
	questions: Question[];
	questionTimer?: ReturnType<typeof setTimeout>;

	constructor( questions: Question[] ) {

		( window as any ).onYouTubeIframeAPIReady = () => {

			// DOCS(supported parameters): https://developers.google.com/youtube/player_parameters
			this.player = new YT.Player( 'player', {
				height: '390',
				width: '640',
				videoId: 'M7lc1UVf-VE',
				playerVars: { 'playsinline': 1 },
				events: {
					onReady: event => this.onPlayerReady( event ),
					onStateChange: event => this.onPlayerStateChange( event ),
				},
			} );

		};

		// Create a script tag to load the YouTube IFrame Player API
		const scriptTag = document.createElement( 'script' );
		scriptTag.src = 'https://www.youtube.com/iframe_api';

		// Insert the script tag into the document before the first script tag
		const firstScriptTag = document.getElementsByTagName( 'script' )[0];
		firstScriptTag?.parentNode?.insertBefore( scriptTag, firstScriptTag );

		// Process questions
		this.questions = questions;

	}

	onPlayerReady( _event: any ): void {

		console.log( 'Player is ready', _event );
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

			if ( ! question.completed && currentTime && currentTime >= question.time ) {

				this.player?.pauseVideo();
				this.displayQuestion( question );
				return;

			}

		}

		this.questionTimer = setTimeout( () => this.displayQuestionCheck(), 1000 );

	}

	displayQuestion( question: Question ): void {

		question.completed = true;

		const questionDiv = document.querySelector( '#question' );

		if ( ! questionDiv ) return;

		questionDiv.innerHTML = `
			<form id="question-form">
				<fieldset>
					<div>${question.question}</div>

					<div>
						${question.answers.map( ( answer, index ) => `
							<label for="choice${index}">
								<input type="radio" id="choice${index}" name="answer" value="${index}" />${answer}
							</label>
							` ).join( '' )}
					</div>

					<div>
						<button id="question-submit" type="submit" disabled>Submit</button>
						<button id="continue" class="secondary">Continue</button>
					</div>
				</fieldset>
			</form>
		`;

		const form = document.querySelector( '#question-form' ) as HTMLFormElement;
		const submitButton = document.querySelector( '#question-submit' ) as HTMLButtonElement;
		const continueButton = document.querySelector( '#continue' ) as HTMLButtonElement;

		form.onsubmit = ( event ) => {

			event.preventDefault();

			const form = event.target as HTMLFormElement;
			const answer = form.answer.value;

			const correct = question.correct === parseInt( answer );

			// If correct, add aria-invalid="false" to the input element
			// If incorrect, add aria-invalid="true" to the input element
			const radio = document.querySelector( `#choice${answer}` ) as HTMLInputElement;
			radio.setAttribute( 'aria-invalid', answer == question.correct ? 'false' : 'true' );

			if ( correct ) {

				submitButton.disabled = true;
				submitButton.textContent = 'Correct!';

			} else {

				submitButton.textContent = 'Try again';

			}

		};

		form.onchange = ( event ) => {

			event.preventDefault();

			const submitButton = document.querySelector( '#question-submit' ) as HTMLButtonElement;
			submitButton.disabled = false;

		};

		continueButton.onclick = () => {

			this.player?.playVideo();
			this.questionTimer = setTimeout( () => this.displayQuestionCheck(), 1000 );

		};

	}

}
