    <p align="center">
    <img src="https://raw.githubusercontent.com/lanlokun/orunmilang/main/images/orunmilang.png" alt="Orunmilang Logo" width="150"/>
    </p>

    # Orunmilang
    **Orunmilang** is a minimal, beginner-friendly programming language inspired by the syntax and linguistic structure of Yoruba, a major African language spoken by millions in Nigeria 🇳🇬, Benin 🇧🇯, Togo 🇹🇬, and parts of Ghana 🇬🇭, Ivory Coast 🇨🇮, Sierra Leone 🇸🇱, and The Gambia 🇬🇲. Designed to teach programming fundamentals through culturally relevant constructs, **Orunmilang** bridges the gap between technology and indigenous knowledge systems. The name Orunmilang derives from Yoruba words: òrúnmìlà (the deity of wisdom and divination in Yoruba spirituality) and ọ̀rọ̀ (word or language), symbolizing a "language of wisdom." This reflects its mission to empower learners by making coding intuitive and culturally resonant.


    **Orunmilang** was created as part of a master’s coursework project in Open Source Software at Nankai University, China, in 2025. It aims to democratize programming education by offering a tool that resonates with African and diasporic learners while being accessible to anyone interested in culturally inspired computing. In a world where technology often reflects Western paradigms, Orunmilang promotes diversity in tech by embedding Yoruba linguistic patterns, such as verb-object structures and tonal expressiveness, into its syntax. This makes it a powerful educational tool and a potential domain-specific language (DSL) for cultural computing, fostering inclusivity and representation in the global tech landscape.


    [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
    [![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](https://github.com/lanlokun/orunmilang/issues)


    ## 🌍 Vision & Roadmap
    **Orunmilang** aims to make programming inclusive by blending coding with Yoruba linguistic structures. It serves as an educational tool and potential domain-specific language (DSL) for cultural computing. Future goals include expanding the type system, adding data structures, and deepening cultural relevance.


    ### Short-term Goals:

    - Add list/array support

    - Implement basic file I/O

    - Expand standard library

    ### Long-term Vision:

    - Full Yoruba localization

    - Visual programming interface

    - Educational materials in Yoruba/English



    ## ✨ Features

    ### Core Language Features
    ✅ **Variable Declaration** (`pa`): Declare variables with initial values  
    ✅ **Variable Assignment** (`fi`): Update variable values  
    ✅ **Print Output** (`tẹ`): Display text, numbers, or variable values  
    ✅ **Arithmetic Operations**: `+`, `-`, `*`, `/`, `%`  
    ✅ **Conditionals** (`ti`/`bí kò ṣe`): If/else-if/else statements  
    ✅ **Loops** (`nigba`): While loops  
    ✅ **Functions** (`iṣẹ`/`pe`/`pada`): Define and call reusable functions  
    ✅ **Comments**: Single-line documentation  

    ### Tooling Features
    ✅ **CLI Support**: Run programs with error reporting  
    ✅ **Type Checking**: Runtime type validation  
    ✅ **Yoruba Keywords**: Culturally relevant syntax  

    ### Cultural Elements  
    - Yoruba keywords and syntax structure  
    - Support for Yoruba diacritics in strings  
    - Culturally relevant error messages  


    ### Core Programming Constructs  
    - `pa` - Variable declaration (`pa oruko pẹlu "Lanlokun"`)  
    - `fi` - Variable assignment (`fi oruko "Malik"`)  
    - `tẹ` - Print output (`tẹ("Kaabo!")`)  
    - `ti`/`bí kò ṣe` - If/else conditionals  
    - `nigba` - While loops  
    - `iṣẹ`/`pe` - Function definition and calls  


    ## 📜 Example Program

    ```orunmilang
    // Calculate the square of a number
    iṣẹ square(num) {
        pada num * num;
    }

    pa x pẹlu 10;
    pa y pẹlu 5;
    pa sum pẹlu x + y;      // 15
    pa squared pẹlu pe square(x);  // 100

    tẹ("Sum:");
    tẹ(sum);
    tẹ("Square of x:");
    tẹ(squared);

    ti (sum > 20) {
        tẹ("Sum is large");
    } bí kò ṣe {
        tẹ("Sum is small");
    }

    ```
    ## Output:

    ```
    Sum:
    15
    Square of x:
    100
    Sum is small
    ```

    ## 🧠 Language Syntax

    ### 🔸 Variable Declaration

    ```orunmilang

    pa <name> pẹlu <value>;  // Numbers, strings, or booleans
    ```

    ###  Variable Assignment

    ```orunmilang

    fi <name> <value>;  // Update existing variable

    ```

    ### Print Statement

    ```orunmilang
    tẹ(<value>);
    ```
    ### Arithmetic Operations
    ``` orunmilang
    <value1> + <value2>  // Addition
    <value1> - <value2>  // Subtraction
    <value1> * <value2>  // Multiplication
    <value1> / <value2>  // Division
    <value1> % <value2>  // Modulo

    ```
    ### Control Flow


    ```orunmilang
    ti (age > 18) ṣe {
        tẹ("O ti tobi!");    // "You're grown!"
    } bí kò ṣe {
        tẹ("O tun kekere");  // "You're still young"
    }

    pa i pẹlu 0;
    nigba (i < 5) ṣe {
        tẹ(i);
        fi i i + 1;
    }

    ```

    #

    ### Functions

    ``` orunmilang

    iṣẹ greet(oruko) {
        pada "Kaabo, " + oruko;
    }

    tẹ(pe greet("Lanlokun"));  // Kaabo, Lanlokun

    ```
    ### Comments

    ```orunmilang

    // Single-line comment

    ```
    ## 🚧 Current Limitations

    | Feature            | Status                 | Notes                                 |
    |--------------------|------------------------|----------------------------------------|
    | Arrays/Objects     | ❌ Not supported        | Support for lists and objects is planned for future versions |
    | Static Typing      | ❌ Runtime only         | No compile-time type checking; types are checked at runtime |
    | Standard Library   | ❌ Minimal built-ins    | Very limited functions available; more will be added |
    | Multi-line Comments| ❌ Single-line only     | Only `//` single-line comments supported for now |



    ### 🛠️ Installation
    ```

    git clone https://github.com/Lanlokun/orunmilang.git
    cd orunmilang
    npm install 
    npm link
    npm run build

    ```

    ## 🚀 Usage

    orunmilang example.orun

    ## 🤝 Contributing

    ### Contributions are welcome! To contribute:

    - Fork the repository.
    - Create a branch: git checkout -b feature/your-feature.
    - Commit changes: git commit -m "Add your feature".
    - Push to the branch: git push origin feature/your-feature.
    - Open a pull request.


    ### 📜 Code of Conduct


    We are committed to fostering an inclusive community. Please adhere to the Contributor Covenant Code of Conduct. Report unacceptable behavior to mlanlokun@gmail.com.

    ### 📈 Project Status

    Orunmilang is in active development, with core features (arithmetic, conditionals, loops, functions) stable. It’s suitable for educational use but lacks advanced features like arrays or a standard library. Contributions to address limitations are encouraged.

    ## 🧑🏽‍💻 Author
    Crafted with love by Malik Kolawole Lanlokun. Reach out via GitHub to collaborate or share ideas.


    ### 📄 License

    This project is licensed under the MIT License - see the LICENSE file for details.


    ## 📝 Report Issues: GitHub Issues



