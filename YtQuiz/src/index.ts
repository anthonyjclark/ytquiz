import '../css/main.css';

import { YtQuiz } from '../lib/main';

const questions = [
	{
		time: 2,
		question: 'This is a fill in the blank question.',
		answers: [],
		correct: 'Here is the correct answer.',
	},
	{
		time: 5,
		question: 'What is the capital of France?',
		answers: [
			'The capital of France is Paris.',
			'The capital of France is London.',
			'The capital of France is Berlin.',
			'The capital of France is Madrid.',
		],
		correct: 0,
	},
	{
		time: 10,
		question: 'What is the capital of Germany?',
		answers: [ 'Paris', 'London', 'Berlin', 'Madrid' ],
		correct: 2,
	},
	{
		time: 15,
		question: 'What is the capital of Spain?',
		answers: [ 'Paris', 'London', 'Berlin', 'Madrid' ],
		correct: 3,
	},
];

console.log( 'first' );
new YtQuiz( 'M7lc1UVf-VE', questions );

console.log( 'second' );
new YtQuiz( 'X2pZ38jLKDA', JSON.parse( JSON.stringify( questions ) ),
);

// document.querySelector<HTMLDivElement>( '#app' )!.innerHTML = `
//   <div>
//     No need to follow this code exactly. This is just a demo.
//   </div>
// `;
