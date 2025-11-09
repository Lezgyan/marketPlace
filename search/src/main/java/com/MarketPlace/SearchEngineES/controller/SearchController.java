package com.MarketPlace.SearchEngineES.controller;

import com.MarketPlace.SearchEngineES.SearchEngine;
import com.MarketPlace.SearchEngineES.dto.Document;
import com.MarketPlace.SearchEngineES.dto.DtoQuery;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
public class SearchController {
    private final SearchEngine searchEngine;

    public SearchController(SearchEngine searchEngine) {
        this.searchEngine = searchEngine;
    }

    @PostMapping("/search")
    public ResponseEntity<List<Document>> getListDocument(@Valid @RequestBody(required = false) DtoQuery dtoQuery) throws IOException {
        return ResponseEntity.ok(searchEngine.getDocumentList(dtoQuery));
    }

    @ExceptionHandler(IOException.class)
    @ResponseBody
    public ResponseEntity<Map<String, String>> handleIO(IOException ex) {
        Map<String, String> err = new HashMap<>();
        err.put("error", "you are so stupid");
        err.put("message", ex.getMessage());
        return new ResponseEntity<>(err, HttpStatus.BAD_REQUEST);
    }


    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseBody
    public ResponseEntity<Map<String, String>> handleValid(MethodArgumentNotValidException ex){
        Map<String, String> err = new HashMap<>();
        err.put("error", "json is not correct");
        err.put("message", ex.getMessage());
        return new ResponseEntity<>(err, HttpStatus.BAD_REQUEST);
    }

}
