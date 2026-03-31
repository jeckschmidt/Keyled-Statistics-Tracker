import '../css/loginPage.css'

const form = document.getElementById("loginForm")
const usernameInput = document.getElementById("username")
const passwordInput = document.getElementById("password")

const usernameError = document.getElementById("usernameError")
const passwordError = document.getElementById("passwordError")

const button = form.querySelector(".login-btn")
const btnText = button.querySelector(".btn-text")
const btnLoader = button.querySelector(".btn-loader")

const successMessage = document.getElementById("successMessage")

let isSubmitting = false

function setLoading(state) {
    button.disabled = state
    btnText.style.display = state ? "none" : "inline"
    btnLoader.style.display = state ? "inline-block" : "none"
}

function clearErrors() {
    usernameError.textContent = ""
    passwordError.textContent = ""

    usernameError.classList.remove("show")
    passwordError.classList.remove("show")
}

function validate(username, password) {
    const errors = {}

    if (!username) errors.username = "Username required"
    if (!password) errors.password = "Password required"

    return errors
}

form.addEventListener("submit", async (e) => {
    e.preventDefault()

    if (isSubmitting) return
    isSubmitting = true

    clearErrors()

    // get user input
    const username = usernameInput.value.trim()
    const password = passwordInput.value

    // validate user input
    const errors = validate(username, password)
    if (errors.username) {
        usernameError.textContent = errors.username
        usernameError.classList.add("show")
    }
    if (errors.password) {
        passwordError.textContent = errors.password
        passwordError.classList.add("show")
    }
    if (Object.keys(errors).length > 0) {
        isSubmitting = false
        return
    } 

    setLoading(true)

    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        })

        const data = await res.json()

        if (!res.ok) {
            throw new Error(data.message || "Login failed")
        }

        form.style.display = "none"
        successMessage.classList.add("show")

        setTimeout(() => {
            window.location.href = "/home"
        }, 1000)

    } catch (err) {
        passwordError.textContent =
            err.name === "AbortError"
                ? "Request timed out"
                : err.message
        passwordError.classList.add("show")
    } finally {
        setLoading(false)
        isSubmitting = false
    }
})


window.addEventListener("pageshow", () => {
    const form = document.getElementById("loginForm")
    const successMessage = document.getElementById("successMessage")

    form.reset()
    form.style.display = "block"
    successMessage.classList.remove("show")

    document.querySelectorAll(".error-message").forEach(el => {
        el.textContent = ""
        el.classList.remove("show")
    })
})