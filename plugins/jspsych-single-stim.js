/**
 * jspsych-single-stim
 * Josh de Leeuw
 *
 * plugin for displaying a stimulus and getting a keyboard response
 *
 * documentation: https://github.com/jodeleeuw/jsPsych/wiki/jspsych-single-stim
 *
 **/

(function($) {
	jsPsych["single-stim"] = (function() {

		var plugin = {};

		plugin.create = function(params) {

			params = jsPsych.pluginAPI.enforceArray(params, ['stimuli', 'choices', 'data']);

			var trials = new Array(params.stimuli.length);
			for (var i = 0; i < trials.length; i++) {
				trials[i] = {};
				trials[i].a_path = params.stimuli[i];
				trials[i].choices = params.choices;
				// option to show image for fixed time interval, ignoring key responses
				//      true = image will keep displaying after response
				//      false = trial will immediately advance when response is recorded
				trials[i].continue_after_response = (typeof params.continue_after_response === 'undefined') ? true : params.continue_after_response;
				// timing parameters
				trials[i].timing_stim = params.timing_stim || -1; // if -1, then show indefinitely
				trials[i].timing_response = params.timing_response || -1; // if -1, then wait for response forever
				// optional parameters
				trials[i].is_html = (typeof params.is_html === 'undefined') ? false : params.is_html;
				trials[i].prompt = (typeof params.prompt === 'undefined') ? "" : params.prompt;
			}
			return trials;
		};



		plugin.trial = function(display_element, trial) {

			// if any trial variables are functions
			// this evaluates the function and replaces
			// it with the output of the function
			trial = jsPsych.pluginAPI.normalizeTrialVariables(trial);

			// this array holds handlers from setTimeout calls
			// that need to be cleared if the trial ends early
			var setTimeoutHandlers = [];

			// display stimulus
			if (!trial.is_html) {
				display_element.append($('<img>', {
					src: trial.a_path,
					id: 'jspsych-single-stim-stimulus'
				}));
			} else {
				display_element.append($('<div>', {
					html: trial.a_path,
					id: 'jspsych-single-stim-stimulus'
				}));
			}

			//show prompt if there is one
			if (trial.prompt !== "") {
				display_element.append(trial.prompt);
			}

			// function to end trial when it is time
			var end_trial = function(info) {

				// kill any remaining setTimeout handlers
				for (var i = 0; i < setTimeoutHandlers.length; i++) {
					clearTimeout(setTimeoutHandlers[i]);
				}

				// kill keyboard listeners
				jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);

				// gather the data to store for the trial
				var trial_data = {
					"rt": info.rt,
					"stimulus": trial.a_path,
					"key_press": info.key
				};

				jsPsych.data.write($.extend({}, trial_data, trial.data));

				// clear the display
				display_element.html('');

				// move on to the next trial
				if (trial.timing_post_trial > 0) {
					setTimeout(function() {
						jsPsych.finishTrial();
					}, trial.timing_post_trial);
				} else {
					jsPsych.finishTrial();
				}
			};

			// function to handle responses by the subject
			var after_response = function(info) {

				// after a valid response, the stimulus will have the CSS class 'responded'
				// which can be used to provide visual feedback that a response was recorded
				$("#jspsych-single-stim-stimulus").addClass('responded');

				if (trial.continue_after_response) {
					// response triggers the next trial in this case.
					// if hide_image_after_response is true, then next
					// trial should be triggered by timeout function below.
					end_trial(info);
				}
			};

			// start the response listener
			var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse(after_response, trial.choices);

			// hide image if timing is set
			if (trial.timing_stim > 0) {
				var t1 = setTimeout(function() {
					$('#jspsych-single-stim-stimulus').css('visibility', 'hidden');
				}, trial.timing_stim);
				setTimeoutHandlers.push(t1);
			}

			// end trial if time limit is set
			if (trial.timing_response > 0) {
				var t2 = setTimeout(function() {
					end_trial({
						rt: -1,
						key: -1
					});
				}, trial.timing_response);
				setTimeoutHandlers.push(t2);
			}

		};

		return plugin;
	})();
})(jQuery);
