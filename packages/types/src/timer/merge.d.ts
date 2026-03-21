declare namespace timer.merge {
    type Rule = {
        /**
         * Origin host, can be regular expression with star signs
         */
        origin: string
        /**
         * The merge result
         *
         * + Empty string means equals to the origin host
         * + Number means the count of kept dots, must be natural number (int & >=0)
         */
        merged: string | number
    }
}
