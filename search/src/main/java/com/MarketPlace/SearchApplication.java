package com.MarketPlace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
<<<<<<< HEAD
@ComponentScan(basePackages = "com.MarketPlace.SearchEngineES")
=======
//@ComponentScan(basePackages = "search.main.java.com.MarketPlace")
>>>>>>> 0cea0712abe133a0e4f241097fbdb377533295c8
public class SearchApplication {

	public static void main(String[] args) {
		SpringApplication.run(SearchApplication.class, args);
	}

}
