'use strict';

const webdriver = require('webdriverio');
const expect = require('chai').expect;
const URL = 'http://localhost:3001/demo/';

let options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

let client;

describe('Функциональные тесты для Yahiko', function() {
    beforeEach(function() {
        client = webdriver.remote(options);
        return client.init();
    });

    afterEach(function() {
        return client.end();
    });

    it('При клике по стрелке навигации отображается следующий слайд', function() {
        return client
            .url(URL)
            .waitForVisible('.yahiko', 3000)

            .isVisible('.yahiko__prev')
            .then(function(isVisible) {
                expect(isVisible).to.be.false;
            })

            .click('.yahiko__next')
            .pause(500)
            .execute(function() {
                return Boolean($('.yahiko__stage_curr .yahiko__item-1').length);
            })
            .then(function(res) {
                expect(res.value).to.be.true;
            })

            .isVisible('.yahiko__prev')
            .then(function(isVisible) {
                expect(isVisible).to.be.true;
            })

            .click('.yahiko__prev')
            .pause(500)
            .execute(function() {
                return Boolean($('.yahiko__stage_curr .yahiko__item-0').length);
            })
            .then(function(res) {
                expect(res.value).to.be.true;
            });
    });

    it('При клике по точке навигации отображается выбранный слайд ', function() {
        return client
            .url(URL)
            .waitForVisible('.yahiko__dots', 3000)
            .click('.yahiko__dot:nth-child(5)')
            .pause(500)
            .execute(function() {
                return Boolean($('.yahiko__stage_curr .yahiko__item-4').length);
            })
            .then(function(res) {
                expect(res.value).to.be.true;
            })

            .isVisible('.yahiko__prev')
            .then(function(isVisible) {
                expect(isVisible).to.be.true;
            });
    });

    it('При наведении мышкой на стрелку показывается превью следующего слайда', function() {
        return client
            .url(URL)
            .waitForVisible('.yahiko__next', 3000)
            .moveToObject('.yahiko__next', 30, 30)
            .pause(500)
            .execute(function() {
                var right = $('.yahiko__precontainer').css('right').replace('px', '');
                return Number(right) === 0;
            })
            .then(function(res) {
                expect(res.value).to.be.true;
            });
    });

    it('Работает бесконечная лента', function () {
        return client
            .url(URL + '?loop=true')
            .waitForVisible('.yahiko', 3000)

            .isVisible('.yahiko__prev')
            .then(function(isVisible) {
                expect(isVisible).to.be.true;
            })

            .click('.yahiko__prev')
            .pause(500)
            .execute(function() {
                return Boolean($('.yahiko__stage_curr .yahiko__item-4').length);
            })
            .then(function(res) {
                expect(res.value).to.be.true;
            })

            .execute(function() {
                return $('.yahiko__dot:nth-child(5)').hasClass('yahiko__dot_current');
            })
            .then(function(res) {
                expect(res.value).to.be.true;
            });
    });
});
