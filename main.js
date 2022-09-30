function Validator(formSelector) {

    function getParent(element, parent) {
        while (element.parentElement) {
            if (element.parentElement.matches(parent)) {
                return element.parentElement
            }
            element = element.parentElement
        }
    }

    var _this = this
    var formRules = {}

    /**
     * Quy ước tạo rules
     * Nếu có lỗi return 'error message'
     * Không có lỗi return 'undefined'
     */
    var validatorRules = {
        required: function (value) {
            return value ? undefined : 'Vui lòng nhập trường này'
        },
        email: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            return regex.test(value) ? undefined : 'Vui lòng nhập email'
        },
        min: function (min) {
            return function (value) {
                return value.length >= min ? undefined : `Vui lòng nhập ít nhất ${min} ký tự`
            }
        },
    }

    // Lấy form element trong DOM theo formSelector
    var formElement = document.querySelector(formSelector)

    // Chỉ xử lý khi có formElement trong DOM
    if (formElement) {

        var inputs = formElement.querySelectorAll('[name][rules]')

        for (var input of inputs) {

            var rules = input.getAttribute('rules').split('|')

            for (var rule of rules) {

                var isRuleHasValue = rule.includes(':')
                var ruleInfo

                if (isRuleHasValue) {
                    ruleInfo = rule.split(':')
                    rule = ruleInfo[0]
                }

                var ruleFunc = validatorRules[rule]

                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1])
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc)
                } else {
                    formRules[input.name] = [ruleFunc]
                }

                input.onblur = handleValidate
                input.oninput = handleValidateClear
            }

            // Hàm thực hiện validate
            function handleValidate(e) {

                var rules = formRules[e.target.name]
                var errorMessage

                for (var rule of rules) {
                    errorMessage = rule(e.target.value)
                    if (errorMessage) break
                }

                if (errorMessage) {
                    var formGroup = getParent(e.target, '.form-group')
                    var errorElement = formGroup.querySelector('.form-message')
                    errorElement.innerHTML = errorMessage
                    formGroup.classList.add('invalid')
                }

                return !errorMessage
            }

            // Hàm Clear lỗi khi nhập
            function handleValidateClear(e) {
                e.target.oninput = function () {
                    var formGroup = getParent(e.target, '.form-group')
                    var errorElement = formGroup.querySelector('.form-message')
                    formGroup.classList.remove('invalid')
                    errorElement.innerHTML = ''
                }
            }

        }
    }

    // Khi submit
    formElement.onsubmit = function (e) {
        e.preventDefault()
        var inputs = formElement.querySelectorAll('[name][rules]')
        var isValid = true

        for (var input of inputs) {
            if (!handleValidate({ target: input })) isValid = false
        }

        if (isValid) {
            if (typeof _this.onSubmit === 'function') {
                var enableInputs = formElement.querySelectorAll('[name]')
                var formValues = Array.from(enableInputs).reduce(function (values, input) {

                    switch (input.type) {
                        case 'radio':
                            checkKey = formElement.querySelector('input[name="' + input.name + '"]:checked')
                            if (checkKey) {
                                values[input.name] = checkKey.value
                            } else { values[input.name] = [] }
                            break

                        case 'checkbox':
                            checkKeys = formElement.querySelectorAll('input[name="' + input.name + '"]:checked')
                            values[input.name] = []
                            if (checkKeys) {
                                Array.from(checkKeys).forEach(checkKey => {
                                    values[input.name].push(checkKey.value)
                                })
                            } else { values[input.name] = [] }
                            break

                        case 'file':
                            values[input.name] = input.files
                            break

                        default:
                            values[input.name] = input.value
                    }

                    return values
                }, {})
                _this.onSubmit(formValues)
            } else {
                formElement.submit()
            }
        }
    }
}