define(['jquery'], function ($) {
	return function () {

		let self = this;
		let settings, w_code;
		let style = '\
		<style id="copy-lead-style">\
			.js-copy-lead {\
				background-color: #313942;\
			}\
			.js-copy-lead .card-widgets__widget__caption__logo {\
				color: #E4E4E4;\
				font-weight: bold;\
				display: block;\
				transform: translate(20px, 12px);\
				height: 0;\
				margin-left: 0;\
				padding: 0;\
			}\
			.js-copy-lead .card-widgets__widget__caption__logo_min {\
				color: #E4E4E4;\
				font-weight: bold;\
				display: block;\
				transform: translate(17px, 12px);\
				width: 0;\
				padding: 0;\
			}\
			.copy-lead .control--select--list-opened {\
				box-sizing: border-box;\
				left: 0;\
			}\
			.copy-lead .select-title {\
				padding-top: 10px;\
			}\
			.copy-lead__info {\
				margin-top: 10px;\
				text-align: center;\
				cursor: default;\
			}\
			.copy-lead__info_load {\
				color: orange;\
			}\
			.copy-lead__info_error {\
				color: red;\
			}\
			.copy-lead__info_success {\
				color: green;\
			}\
			.copy-lead__button_disable {\
				cursor: not-allowed;\
			}\
			.copy-lead__button {\
				margin-top: 10px;\
				text-align: center;\
				border: 1px solid #D4D5D8;\
				border-radius: 3px;\
				padding: 5px;\
				transition: 0.3s;\
			}\
			.copy-lead__button:hover {\
				background-color: #FBFAFB;\
			}\
		</style>';

		function getNumberVal(elem) {
			let val = $(elem).val().replace(/\s/g, '');
			return Number(val);
		}

		function numberWithSpaces(x) {
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
		}


		function replaceTextSelectButton(elem, text) {
			$(elem).find('.control--select--button').text(text);
		}

		function GetLeads(pipelineId, count, size = 250) {
			let page = 1;
			let leads = [];
			for (let i = 1; i < (count / size) + 1; i++) {
				$.ajax({
					url: '/api/v4/leads?limit=' + size + '&page=' + page + '&filter[pipeline_id]=' + pipelineId,
					method: "GET",
					async: false,
					contentType: 'application/json',
					success: function (data) {
						data._embedded.leads.forEach(function (item) {
							leads.push(item);
						})
					}
				});
			}
			return leads;
		}

		this.callbacks = {
			render: function () {
				if ($('#copy-lead-style').length == 0)
					$('head').append(style);

				self.render_template({
					caption: {
						class_name: 'js-copy-lead',
						html: ''
					},
					body: '',
					render: '\
					<div class="copy-lead">\
						<p class="select-title">Воронка:</p>\
						<div class="control--select linked-form__select select-pipeline">\
							<ul class="custom-scroll control--select--list">\
								<li data-value="" class="control--select--list--item control--select--list--item-selected">\
									<span class="control--select--list--item-inner" title="Выбрать">\
										Выбрать\
									</span>\
								</li>\
							</ul>\
							\
							<button class="control--select--button" type="button" data-value="" style="border-bottom-width: 1px; background-color: #fff;">\
								<span class="control--select--button-inner">\
									Выбрать\
								</span>\
							</button>\
							\
							<input type="hidden" class="control--select--input " name="select-pipeline" value="" data-prev-value="">\
						</div>\
						<div class="copy-lead__button copy-lead__button_disable"">Скопировать</div>\
						<p class="copy-lead__info"></p>\
					</div>'
				});
				let select_pipeline = $('.copy-lead .select-pipeline');
				let statuses;
				let pipelines = {};
				$.ajax({
					method: 'GET',
					url: '/api/v4/leads/pipelines',
					dataType: 'json',
					beforeSend: function () {
						replaceTextSelectButton(select_pipeline, 'Загрузка...');
					},
					error: function () {
						replaceTextSelectButton(select_pipeline, 'Ошибка');
					},
					success: function (data) {
						replaceTextSelectButton(select_pipeline, 'Выбрать');

						data._embedded.pipelines.forEach(item => {
							let statuses = item['_embedded']['statuses'];
							pipelines[item['id']] = {
								name: item['name'],
								statuses: {}
							};
							statuses.forEach(elem => {
								if (elem.name.replace(/\s/g, '') != 'Неразобранное')
									pipelines[item['id']]['statuses'][elem['id']] = elem['name'];
							});
						});

						for (let id in pipelines) {
							let str = `
							<li data-value="${id}" class="control--select--list--item">\
								<span class="control--select--list--item-inner" title="${pipelines[id]['name']}">\
									${pipelines[id]['name']}\
								</span>\
							</li>`;
							$(str).appendTo('.copy-lead .select-pipeline .custom-scroll');
						}
					}
				});

				$('[name="select-pipeline"]').on('change', function () {
					let status_id = $(this).val();
					if (status_id != '') {
						if ($('.copy-lead .select-status').length == 0) {
							$(select_pipeline).after('\
							<p class="select-title">Этап:</p>\
							<div class="control--select linked-form__select select-status">\
								<ul class="custom-scroll control--select--list">\
									<li data-value="" class="control--select--list--item control--select--list--item-selected">\
										<span class="control--select--list--item-inner" title="Выбрать">\
											Выбрать\
										</span>\
									</li>\
								</ul>\
								\
								<button class="control--select--button" type="button" data-value="" style="border-bottom-width: 1px; background-color: #fff;">\
									<span class="control--select--button-inner">\
										Выбрать\
									</span>\
								</button>\
								\
								<input type="hidden" class="control--select--input " name="select-status" value="" data-prev-value="">\
							</div>');
						}
						if ($('.copy-lead .select-status .control--select--list--item').length > 1) {
							$('.copy-lead .select-status .control--select--list--item:not(:first-child').remove();
							$('.copy-lead .select-status .control--select--list--item').addClass('control--select--list--item-selected');
							replaceTextSelectButton('.copy-lead .select-status', 'Выбрать');
							$('[name="select-status"]').val('');
						}

						statuses = pipelines[status_id]['statuses'];
						for (let id in statuses) {
							let str = `
							<li data-value="${id}" class="control--select--list--item">\
								<span class="control--select--list--item-inner" title="${statuses[id]}">\
									${statuses[id]}\
								</span>\
							</li>`;
							$(str).appendTo('.copy-lead .select-status .custom-scroll');
						}
					} else {
						$('.copy-lead .select-status').prev().remove();
						$('.copy-lead .select-status').remove();
					}
				});

				$('.copy-lead').on('change', '[name="select-pipeline"]', function () {
					let change_id = $(this).val();
					if (change_id == '') replaceTextSelectButton($(this).parent(), 'Выбрать');
					else replaceTextSelectButton($(this).parent(), pipelines[change_id]['name']);
					$('.copy-lead__button').addClass('copy-lead__button_disable');
				});
				$('.copy-lead').on('change', '[name="select-status"]', function () {
					let change_id = $(this).val();
					if (change_id == '') {
						replaceTextSelectButton($(this).parent(), 'Выбрать');
						$('.copy-lead__button').addClass('copy-lead__button_disable');
					} else {
						replaceTextSelectButton($(this).parent(), statuses[change_id]);
						$('.copy-lead__button').removeClass('copy-lead__button_disable');
					}
				});


				if (success >= total_success) {
					$('.copy-lead__info')
						.removeClass('copy-lead__info_load copy-lead__info_error')
						.addClass('copy-lead__info_success')
						.text('Готово!');
				} else {
					$('.copy-lead__info')
						.removeClass('copy-lead__info_load copy-lead__info_success')
						.addClass('copy-lead__info_error')
						.text('Ошибка');
				}

				$('.copy-lead__button').on('click', function () {
					if (!$(this).hasClass('copy-lead__button_disable')) {
						let pipeline_id = Number($('.copy-lead [name="select-pipeline"]').val());
						let status_id = Number($('.copy-lead [name="select-status"]').val());
						let lead_id = AMOCRM.data.current_card.id;

						if (pipeline_id && status_id && lead_id) {
							let leadData = getCurrentLeadAndCopy(lead_id)
							copyLead(pipeline_id, status_id, leadData);
						} else {
							alert('Пожалуйста, выберите воронку и этап сделки.');
						}
					}
				});

				function getCurrentLeadAndCopy(lead_id) {
					// Получить текущую карточку сделки
					$.ajax({
						method: 'GET',
						url: '/api/v4/leads/' + lead_id,
					});
				}

				function copyLead(pipeline_id, status_id, leadData) {

					// Фильтровать только заполненные поля
					let filledFields = {};
					for (const [key, value] of Object.entries(leadData)) {
						if (value !== null && value !== '' && value !== undefined) {
							filledFields[key] = value;
						}
					}

					// Заменяем значения pipeline_id и status_id
					filledFields.pipeline_id = pipeline_id;
					filledFields.status_id = status_id;

					// Отправить AJAX-запрос для копирования сделки с заполненными полями
					$.ajax({
						method: 'POST',
						url: '/api/v4/leads',
						data: JSON.stringify(filledFields),
						contentType: 'application/json',
					});
				}




				$('.js-copy-lead img').remove();
				$('.js-copy-lead span').first().after('\
					<span class="card-widgets__widget__caption__logo">Скопировать</span>\
					<span class="card-widgets__widget__caption__logo_min">Скоп</span>\
				');

				// styles
				setInterval(() => {
					if ($('.card-widgets.js-widgets-active').length > 0) {
						$('.js-copy-lead .card-widgets__widget__caption__logo').show();
						$('.js-copy-lead .card-widgets__widget__caption__logo_min').hide();
					} else {
						$('.js-copy-lead .card-widgets__widget__caption__logo').hide();
						$('.js-copy-lead .card-widgets__widget__caption__logo_min').show();
					}
				}, 100);

				$('.copy-lead').parent().css({
					'background-color': '#fff'
				});
				return true;
			},
			init: function () {
				settings = self.get_settings();
				w_code = settings.widget_code;

				return true;
			},
			bind_actions: function () {
				return true;
			},
			settings: function () {
				return true;
			},
			onSave: function () {
				return true;
			},
			destroy: function () { },
			advancedSettings: function () {
				return true;
			},
			contacts: {
				selected: function () { }
			},
			leads: {
				selected: function () { }
			},
			tasks: {
				selected: function () { }
			}
		};

		return this;
	}
});