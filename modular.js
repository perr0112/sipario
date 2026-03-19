export class Modular {
    constructor() {
        this.links = []
    }

    init() {
        const links = document.querySelectorAll("a") // <- to improve

        links.forEach(link => {
            this.links.push(link)

            link.addEventListener("click", (e) => {
                e.preventDefault()
                const { href } = e.target

                console.log("?", e, href)
                this.goTo(href)
            })

        })
    }

    goTo(href) {
        fetch(href).then((res) => {
            console.log("------------------------------")
            console.log("----------- fetch ------------")
            // console.log(res.text())
            console.log("------------------------------")

            return res.text()
        }).then((data) => {
            const parser = new DOMParser();
            console.log("then", data, parser)
        })
        // fetch(href).then(res => res.text())
    }
}